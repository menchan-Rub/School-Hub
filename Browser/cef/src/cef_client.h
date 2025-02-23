#ifndef CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_
#define CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_

#include "include/cef_client.h"
#include <vector>
#include <set>
#include <memory>

class WebSocketHandler;

class BrowserClient : public CefClient,
                     public CefLifeSpanHandler,
                     public CefLoadHandler,
                     public CefDisplayHandler,
                     public CefKeyboardHandler,
                     public CefLoadingHandler,
                     public CefRequestHandler {
 public:
  BrowserClient();
  ~BrowserClient();

  // CefClient methods
  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }
  virtual CefRefPtr<CefLoadHandler> GetLoadHandler() override { return this; }
  virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() override { return this; }
  virtual CefRefPtr<CefKeyboardHandler> GetKeyboardHandler() override { return this; }
  virtual CefRefPtr<CefLoadingHandler> GetLoadingHandler() override { return this; }
  virtual CefRefPtr<CefRequestHandler> GetRequestHandler() override { return this; }

  // CefLifeSpanHandler methods
  void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  bool DoClose(CefRefPtr<CefBrowser> browser) override;
  void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;
  bool OnBeforePopup(CefRefPtr<CefBrowser> browser,
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
                    bool* no_javascript_access) override;

  // CefLoadHandler methods
  void OnLoadError(CefRefPtr<CefBrowser> browser,
                  CefRefPtr<CefFrame> frame,
                  ErrorCode errorCode,
                  const CefString& errorText,
                  const CefString& failedUrl) override;

  // CefDisplayHandler methods
  void OnTitleChange(CefRefPtr<CefBrowser> browser,
                    const CefString& title) override;
  void OnAddressChange(CefRefPtr<CefBrowser> browser,
                      CefRefPtr<CefFrame> frame,
                      const CefString& url) override;
  void OnFaviconURLChange(CefRefPtr<CefBrowser> browser,
                         const std::vector<CefString>& icon_urls) override;

  // CefLoadingHandler methods
  void OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                          bool isLoading,
                          bool canGoBack,
                          bool canGoForward) override;

  // CefKeyboardHandler methods
  bool OnKeyEvent(CefRefPtr<CefBrowser> browser,
                 const CefKeyEvent& event,
                 CefEventHandle os_event) override;

  // Custom methods
  void CreateNewTab(const CefString& url);
  void CloseTab(CefRefPtr<CefBrowser> browser);
  void NavigateToUrl(const CefString& url);
  bool IsClosing() const { return is_closing_; }

 private:
  bool is_closing_;
  typedef std::vector<CefRefPtr<CefBrowser>> BrowserList;
  BrowserList browser_list_;
  int current_browser_id_;
  std::unique_ptr<WebSocketHandler> ws_handler_;

  IMPLEMENT_REFCOUNTING(BrowserClient);
  DISALLOW_COPY_AND_ASSIGN(BrowserClient);
};

#endif  // CEF_TESTS_CEFSIMPLE_SIMPLE_HANDLER_H_ 