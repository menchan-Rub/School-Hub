cmake_minimum_required(VERSION 3.13)
project(lightweight_browser)

# CMakeモジュールパスを設定
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# CEFのパスを設定
set(CEF_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/third_party/cef")

# CEFパッケージを探す
find_package(CEF REQUIRED)

# X11パッケージを探す
if(UNIX)
  find_package(X11 REQUIRED)
endif()

# WebSocket++とjsoncppを探す
find_package(websocketpp REQUIRED)
find_package(jsoncpp REQUIRED)

# Boost ASIO
find_package(Boost REQUIRED COMPONENTS system)

# スレッドライブラリ
find_package(Threads REQUIRED)

# コンパイラフラグの設定
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(UNIX)
  # Linux固有の設定
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wno-unused-parameter -fpermissive")
  set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O3")
endif()

# ソースファイルの設定
set(BROWSER_SRCS
  src/main.cc
  src/cef_app.cc
  src/cef_client.cc
)

# インクルードディレクトリの設定
include_directories(
  ${CEF_INCLUDE_DIRS}
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${X11_INCLUDE_DIR}
  ${WEBSOCKETPP_INCLUDE_DIR}
  ${JSONCPP_INCLUDE_DIRS}
  ${Boost_INCLUDE_DIRS}
)

# 実行ファイルの設定
add_executable(${PROJECT_NAME} ${BROWSER_SRCS})

# ライブラリのリンク
target_link_libraries(${PROJECT_NAME} 
  ${CEF_LIBRARIES}
  ${X11_LIBRARIES}
  ${JSONCPP_LIBRARIES}
  ${Boost_LIBRARIES}
  Threads::Threads
)

# リソースの設定
if(UNIX)
  # Linux用のリソース設定
  copy_cef_binary(${PROJECT_NAME})
  
  # CEFリソースのコピー
  copy_cef_resources(${PROJECT_NAME})
endif()

# インストール設定
install(TARGETS ${PROJECT_NAME}
  RUNTIME DESTINATION bin
)

# デバッグ情報の設定
set_target_properties(${PROJECT_NAME} PROPERTIES
  COMPILE_FLAGS_DEBUG "-g"
  COMPILE_FLAGS_RELEASE "-O3"
) 