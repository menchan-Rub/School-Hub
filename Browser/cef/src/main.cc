#include "../third_party/cef/include/cef_app.h"
#include "../third_party/cef/include/cef_command_line.h"
#include "../third_party/cef/include/wrapper/cef_helpers.h"
#include "../include/cef_app.h"
#include <X11/Xlib.h>
#include "include/cef_app.h"
#include "include/cef_client.h"
#include "cef_client.h"
#include "cef_app.h"

#if defined(OS_WIN)
#include <windows.h>
#endif

#if defined(OS_WIN)
int APIENTRY wWinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPTSTR lpCmdLine,
                     int nCmdShow) {
  UNREFERENCED_PARAMETER(hPrevInstance);
  UNREFERENCED_PARAMETER(lpCmdLine);
  UNREFERENCED_PARAMETER(nCmdShow);

  CefEnableHighDPISupport();

  void* sandbox_info = nullptr;

#if defined(CEF_USE_SANDBOX)
  CefScopedSandboxInfo scoped_sandbox;
  sandbox_info = scoped_sandbox.sandbox_info();
#endif

  CefMainArgs main_args(hInstance);
#else
int main(int argc, char* argv[]) {
  // X11の初期化
  XInitThreads();

  // CEFの初期化
  CefMainArgs main_args(argc, argv);
  CefRefPtr<BrowserApp> app(new BrowserApp);

  int exit_code = CefExecute(main_args, app, nullptr);
  if (exit_code >= 0)
    return exit_code;

  CefSettings settings;
  settings.no_sandbox = true;
  settings.windowless_rendering_enabled = false;
  
  // キャッシュパスの設定
  std::string cache_path = "/tmp/cef_cache";
  CefString(&settings.root_cache_path) = cache_path;
  
  // コマンドライン引数の設定
  CefRefPtr<CefCommandLine> command_line = CefCommandLine::CreateCommandLine();
  command_line->InitFromArgv(argc, argv);
  command_line->AppendSwitch("disable-gpu");
  command_line->AppendSwitch("disable-gpu-compositing");
  command_line->AppendSwitch("disable-software-rasterizer");
  command_line->AppendSwitch("in-process-gpu");
  command_line->AppendSwitch("disable-extensions");
  command_line->AppendSwitch("disable-plugins");

  // CEFの初期化
  CefInitialize(main_args, settings, app, nullptr);

  // ブラウザの作成
  CefRefPtr<BrowserClient> client(new BrowserClient());
  
  // ウィンドウ情報の設定
  CefWindowInfo window_info;
  CefRect rect(0, 0, 1024, 768);
  window_info.bounds = rect;
  
  // ブラウザ設定
  CefBrowserSettings browser_settings;
  browser_settings.javascript = STATE_ENABLED;
  browser_settings.local_storage = STATE_ENABLED;
  browser_settings.databases = STATE_ENABLED;
  
  // ブラウザの作成
  CefBrowserHost::CreateBrowser(window_info, client.get(),
                              "https://www.google.com",
                              browser_settings, nullptr, nullptr);

  // メッセージループの実行
  CefRunMessageLoop();

  // CEFのシャットダウン
  CefShutdown();

  return 0;
} 