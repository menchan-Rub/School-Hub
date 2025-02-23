# CEFのルートディレクトリを設定
set(CEF_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/third_party/cef" CACHE PATH "Path to CEF root directory")

# CEFのライブラリを探す
find_library(CEF_LIBRARY
  NAMES cef libcef cef.lib libcef.lib
  PATHS "${CEF_ROOT}/Release"
  NO_DEFAULT_PATH
)

find_library(CEF_WRAPPER_LIBRARY
  NAMES cef_dll_wrapper libcef_dll_wrapper
  PATHS "${CEF_ROOT}/build/libcef_dll_wrapper"
  PATH_SUFFIXES Debug Release
  NO_DEFAULT_PATH
)

# CEFのインクルードディレクトリを設定
set(CEF_INCLUDE_DIRS
  "${CEF_ROOT}"
  "${CEF_ROOT}/include"
)

# CEFのライブラリを設定
set(CEF_LIBRARIES
  ${CEF_LIBRARY}
  ${CEF_WRAPPER_LIBRARY}
)

# CEFのリソースディレクトリを設定
set(CEF_RESOURCE_DIR "${CEF_ROOT}/Resources")
set(CEF_BINARY_DIR "${CEF_ROOT}/Release")

# CEFのリソースをコピーする関数
function(copy_cef_binary target)
  if(UNIX)
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CEF_BINARY_DIR}/libcef.so"
        $<TARGET_FILE_DIR:${target}>/libcef.so
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CEF_BINARY_DIR}/v8_context_snapshot.bin"
        $<TARGET_FILE_DIR:${target}>/v8_context_snapshot.bin
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CEF_BINARY_DIR}/libEGL.so"
        $<TARGET_FILE_DIR:${target}>/libEGL.so
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CEF_BINARY_DIR}/libGLESv2.so"
        $<TARGET_FILE_DIR:${target}>/libGLESv2.so
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${CEF_BINARY_DIR}/chrome-sandbox"
        $<TARGET_FILE_DIR:${target}>/chrome-sandbox
    )
  endif()
endfunction()

function(copy_cef_resources target)
  if(UNIX)
    add_custom_command(TARGET ${target} POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_directory
        "${CEF_RESOURCE_DIR}"
        $<TARGET_FILE_DIR:${target}>
    )
  endif()
endfunction()

# パッケージの処理
include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(CEF
  REQUIRED_VARS CEF_LIBRARY CEF_WRAPPER_LIBRARY CEF_INCLUDE_DIRS
) 