cmake_minimum_required(VERSION 3.15)
project(SecureVault VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/backend
    ${CMAKE_CURRENT_SOURCE_DIR}/backend/database
    ${CMAKE_CURRENT_SOURCE_DIR}/backend/services
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/crow
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/asio/include
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/sqlite
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/libsodium/include
)

# Find sodium library portably
find_library(SODIUM_LIB NAMES sodium libsodium
    PATHS
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party/libsodium/lib
    /usr/lib/x86_64-linux-gnu
    /usr/lib
    /usr/local/lib
)

if(NOT SODIUM_LIB)
    set(SODIUM_LIB "sodium")
endif()

# SQLite library from amalgamation
add_library(sqlite3 STATIC third_party/sqlite/sqlite3.c)
target_include_directories(sqlite3 PUBLIC third_party/sqlite)

# Backend Executable
add_executable(securevault_server
    backend/main.cpp
    backend/database/database.cpp
    backend/services/crypto_service.cpp
    backend/services/session_service.cpp
)

# Link libraries
target_link_libraries(securevault_server PRIVATE
    sqlite3
    ${SODIUM_LIB}
    pthread
    dl
)

# Set runtime rpath
set_target_properties(securevault_server PROPERTIES
    BUILD_RPATH "${CMAKE_CURRENT_SOURCE_DIR}/third_party/libsodium/lib"
    INSTALL_RPATH "${CMAKE_CURRENT_SOURCE_DIR}/third_party/libsodium/lib"
)
