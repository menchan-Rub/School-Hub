#include "../include/cef_app.h"
#include "../include/cef_client.h"

#include "../third_party/cef/include/wrapper/cef_helpers.h"
#include <X11/Xlib.h>

BrowserApp::BrowserApp() {
  // コマンドライン引数を設定
  CefRefPtr<CefCommandLine> command_line = CefCommandLine::CreateCommandLine();
  command_line->InitFromString("");
  command_line->AppendSwitch("disable-gpu");
  command_line->AppendSwitch("disable-gpu-compositing");
  command_line->AppendSwitch("disable-software-rasterizer");
  command_line->AppendSwitch("in-process-gpu");
}

void BrowserApp::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

  // ブラウザ設定
  CefBrowserSettings browser_settings;
  browser_settings.javascript = STATE_ENABLED;
  browser_settings.local_storage = STATE_ENABLED;
  browser_settings.databases = STATE_ENABLED;
  browser_settings.webgl = STATE_ENABLED;

  // ウィンドウ情報
  CefWindowInfo window_info;
#if defined(OS_WIN)
  window_info.SetAsPopup(nullptr, "Lightweight Browser");
#else
  // Linux用のウィンドウ設定
  window_info.bounds = CefRect(0, 0, 1024, 768);
  window_info.parent_window = 0;
  window_info.windowless_rendering_enabled = false;
#endif

  // クライアントハンドラーの作成
  CefRefPtr<BrowserClient> client(new BrowserClient());

  // ブラウザの作成
  CefBrowserHost::CreateBrowser(window_info, client.get(),
                               "https://www.google.com", browser_settings,
                               nullptr, nullptr);
} 