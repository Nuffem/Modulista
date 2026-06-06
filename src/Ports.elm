port module Ports exposing (requestFolderSelect, confirmFolder, navigateToPath, requestDatabaseOpen, requestDatabaseCreate, requestLogout, folderPicked, folderContentReceived, databaseOpened)

import Data.FileEntry exposing (FileEntry)

port requestFolderSelect : () -> Cmd msg
port confirmFolder : String -> Cmd msg
port navigateToPath : List String -> Cmd msg
port requestDatabaseOpen : () -> Cmd msg
port requestDatabaseCreate : () -> Cmd msg
port requestLogout : () -> Cmd msg
port folderPicked : ({ name : String } -> msg) -> Sub msg
port folderContentReceived : ({ path : List String, files : List FileEntry, rootName : String, rootRealName : String } -> msg) -> Sub msg
port databaseOpened : ({ name : String } -> msg) -> Sub msg
