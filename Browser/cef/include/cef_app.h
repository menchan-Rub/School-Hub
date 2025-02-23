#pragma once

#include "../third_party/cef/include/cef_base.h"
#include "../third_party/cef/include/cef_client.h"
#include "../third_party/cef/include/cef_app.h"

class BrowserApp : public CefApp,
                  public CefBrowserProcessHandler {
 public:
  BrowserApp();
  ~BrowserApp() {}

  // CefApp methods
  CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  // CefBrowserProcessHandler methods
  void OnContextInitialized() override;

 private:
  IMPLEMENT_REFCOUNTING(BrowserApp);
  DISALLOW_COPY_AND_ASSIGN(BrowserApp);
}; 