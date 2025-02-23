#include "../include/cef_client.h"

#include <sstream>
#include <string>
#include <json/json.h>
#include <websocketpp/config/asio_no_tls_client.hpp>
#include <websocketpp/client.hpp>

typedef websocketpp::client<websocketpp::config::asio_client> WebSocketClient;

class WebSocketHandler {
public:
  WebSocketHandler() : endpoint_() {
    endpoint_.init_asio();
    endpoint_.start_perpetual();
    thread_ = std::make_shared<std::thread>(&WebSocketClient::run, &endpoint_);
  }

  ~WebSocketHandler() {
    endpoint_.stop_perpetual();
    if (thread_ && thread_->joinable()) {
      thread_->join();
    }
  }

  void send(const std::string& message) {
    websocketpp::lib::error_code ec;
    if (connection_) {
      endpoint_.send(connection_->get_handle(), message, websocketpp::frame::opcode::text, ec);
    }
  }

  void connect(const std::string& uri) {
    websocketpp::lib::error_code ec;
    connection_ = endpoint_.get_connection(uri, ec);
    if (ec) {
      return;
    }
    endpoint_.connect(connection_);
  }

private:
  WebSocketClient endpoint_;
  std::shared_ptr<std::thread> thread_;
  WebSocketClient::connection_ptr connection_;
};

BrowserClient::BrowserClient() : is_closing_(false), current_browser_id_(-1) {
  ws_handler_ = std::make_unique<WebSocketHandler>();
  ws_handler_->connect("ws://localhost:3000");
}

BrowserClient::~BrowserClient() {}

void BrowserClient::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  browser_list_.push_back(browser);
  current_browser_id_ = browser->GetIdentifier();

  // WebSocketを通じてフロントエンドに通知
  Json::Value message;
  message["type"] = "TAB_CREATED";
  message["tabId"] = current_browser_id_;
  message["url"] = "about:blank";
  message["title"] = "新しいタブ";

  Json::FastWriter writer;
  ws_handler_->send(writer.write(message));
}

bool BrowserClient::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  if (browser_list_.size() == 1) {
    is_closing_ = true;
  }
  return false;
}

void BrowserClient::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  for (auto it = browser_list_.begin(); it != browser_list_.end(); ++it) {
    if ((*it)->IsSame(browser)) {
      browser_list_.erase(it);
      break;
    }
  }
  if (browser_list_.empty()) {
    CefQuitMessageLoop();
  }
}

void BrowserClient::OnLoadError(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              ErrorCode errorCode,
                              const CefString& errorText,
                              const CefString& failedUrl) {
  CEF_REQUIRE_UI_THREAD();
  if (frame->IsMain()) {
    // エラーページの生成
    std::stringstream ss;
    ss << "<html><body><h2>Failed to load URL: " << std::string(failedUrl)
       << "</h2><p>Error: " << std::string(errorText) << " (" << errorCode
       << ")</p></body></html>";
    frame->LoadString(ss.str(), failedUrl);

    // WebSocketを通じてフロントエンドに通知
    Json::Value message;
    message["type"] = "LOAD_ERROR";
    message["tabId"] = browser->GetIdentifier();
    message["errorCode"] = errorCode;
    message["errorText"] = errorText.ToString();
    message["failedUrl"] = failedUrl.ToString();

    Json::FastWriter writer;
    ws_handler_->send(writer.write(message));
  }
}

void BrowserClient::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                const CefString& title) {
  CEF_REQUIRE_UI_THREAD();

  // WebSocketを通じてフロントエンドに通知
  Json::Value message;
  message["type"] = "TITLE_CHANGED";
  message["tabId"] = browser->GetIdentifier();
  message["title"] = title.ToString();

  Json::FastWriter writer;
  ws_handler_->send(writer.write(message));
}

void BrowserClient::OnAddressChange(CefRefPtr<CefBrowser> browser,
                                  CefRefPtr<CefFrame> frame,
                                  const CefString& url) {
  CEF_REQUIRE_UI_THREAD();
  if (frame->IsMain()) {
    // WebSocketを通じてフロントエンドに通知
    Json::Value message;
    message["type"] = "URL_CHANGED";
    message["tabId"] = browser->GetIdentifier();
    message["url"] = url.ToString();

    Json::FastWriter writer;
    ws_handler_->send(writer.write(message));
  }
}

void BrowserClient::OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                                       bool isLoading,
                                       bool canGoBack,
                                       bool canGoForward) {
  CEF_REQUIRE_UI_THREAD();

  // WebSocketを通じてフロントエンドに通知
  Json::Value message;
  message["type"] = "LOADING_STATE_CHANGED";
  message["tabId"] = browser->GetIdentifier();
  message["isLoading"] = isLoading;
  message["canGoBack"] = canGoBack;
  message["canGoForward"] = canGoForward;

  Json::FastWriter writer;
  ws_handler_->send(writer.write(message));
}

void BrowserClient::OnFaviconURLChange(CefRefPtr<CefBrowser> browser,
                                     const std::vector<CefString>& icon_urls) {
  CEF_REQUIRE_UI_THREAD();
  if (!icon_urls.empty()) {
    // WebSocketを通じてフロントエンドに通知
    Json::Value message;
    message["type"] = "FAVICON_CHANGED";
    message["tabId"] = browser->GetIdentifier();
    message["favicon"] = icon_urls[0].ToString();

    Json::FastWriter writer;
    ws_handler_->send(writer.write(message));
  }
}

bool BrowserClient::OnBeforePopup(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame,
                                const CefString& target_url,
                                const CefString& target_frame_name,
                                WindowOpenDisposition target_disposition,
                                bool user_gesture,
                                const CefPopupFeatures& popupFeatures,
                                CefWindowInfo& windowInfo,
                                CefRefPtr<CefClient>& client,
                                CefBrowserSettings& settings,
                                CefRefPtr<CefDictionaryValue>& extra_info,
                                bool* no_javascript_access) {
  CEF_REQUIRE_UI_THREAD();

  // 新しいタブとして開く
  CreateNewTab(target_url);
  return true;
}

bool BrowserClient::OnKeyEvent(CefRefPtr<CefBrowser> browser,
                             const CefKeyEvent& event,
                             CefEventHandle os_event) {
  if (event.type == KEYEVENT_RAWKEYDOWN) {
    // Ctrl+T: 新しいタブ
    if (event.modifiers & EVENTFLAG_CONTROL_DOWN && event.windows_key_code == 'T') {
      CreateNewTab("");
      return true;
    }
    // Ctrl+W: タブを閉じる
    if (event.modifiers & EVENTFLAG_CONTROL_DOWN && event.windows_key_code == 'W') {
      CloseTab(browser);
      return true;
    }
  }
  return false;
}

void BrowserClient::CreateNewTab(const CefString& url) {
  CEF_REQUIRE_UI_THREAD();
  CefWindowInfo window_info;
  CefBrowserSettings browser_settings;
  
  window_info.SetAsPopup(nullptr, "New Tab");
  CefBrowserHost::CreateBrowser(window_info, this, url.empty() ? "about:blank" : url,
                              browser_settings, nullptr, nullptr);
}

void BrowserClient::CloseTab(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  browser->GetHost()->CloseBrowser(false);
}

void BrowserClient::NavigateToUrl(const CefString& url) {
  CEF_REQUIRE_UI_THREAD();
  for (const auto& browser : browser_list_) {
    if (browser->GetIdentifier() == current_browser_id_) {
      browser->GetMainFrame()->LoadURL(url);
      break;
    }
  }
} 