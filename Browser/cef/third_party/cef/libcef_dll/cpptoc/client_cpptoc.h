// Copyright (c) 2025 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.
//
// ---------------------------------------------------------------------------
//
// This file was generated by the CEF translator tool. If making changes by
// hand only do so within the body of existing method and function
// implementations. See the translator.README.txt file in the tools directory
// for more information.
//
// $hash=98aa6485423d9433a2ff6178e25698271a6f40d8$
//

#ifndef CEF_LIBCEF_DLL_CPPTOC_CLIENT_CPPTOC_H_
#define CEF_LIBCEF_DLL_CPPTOC_CLIENT_CPPTOC_H_
#pragma once

#if !defined(WRAPPING_CEF_SHARED)
#error This file can be included wrapper-side only
#endif

#include "include/capi/cef_client_capi.h"
#include "include/cef_client.h"
#include "libcef_dll/cpptoc/cpptoc_ref_counted.h"

// Wrap a C++ class with a C structure.
// This class may be instantiated and accessed wrapper-side only.
class CefClientCppToC
    : public CefCppToCRefCounted<CefClientCppToC, CefClient, cef_client_t> {
 public:
  CefClientCppToC();
  virtual ~CefClientCppToC();
};

constexpr auto CefClientCppToC_Wrap = CefClientCppToC::Wrap;
constexpr auto CefClientCppToC_Unwrap = CefClientCppToC::Unwrap;

#endif  // CEF_LIBCEF_DLL_CPPTOC_CLIENT_CPPTOC_H_
