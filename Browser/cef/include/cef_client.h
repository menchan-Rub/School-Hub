#pragma once

#include "../third_party/cef/include/cef_client.h"
#include "../third_party/cef/include/cef_life_span_handler.h"
#include "../third_party/cef/include/cef_load_handler.h"

class BrowserClient : public CefClient,
                     public CefLifeSpanHandler,
                     public CefLoadHandler {
 public:
  BrowserClient();
  ~BrowserClient();

  // CefClient methods
  CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }
  CefRefPtr<CefLoadHandler> GetLoadHandler() override { return this; }

  // CefLifeSpanHandler methods
  void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  bool DoClose(CefRefPtr<CefBrowser> browser) override;
  void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

  // CefLoadHandler methods
  void OnLoadError(CefRefPtr<CefBrowser> browser,
                  CefRefPtr<CefFrame> frame,
                  ErrorCode errorCode,
                  const CefString& errorText,
                  const CefString& failedUrl) override;

  bool IsClosing() const { return is_closing_; }

 private:
  bool is_closing_;
  CefRefPtr<CefBrowser> browser_;

  IMPLEMENT_REFCOUNTING(BrowserClient);
  DISALLOW_COPY_AND_ASSIGN(BrowserClient);
}; 