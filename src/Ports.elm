port module Ports exposing (requestFolderSelect, confirmFolder, navigateToPath, folderPicked, folderContentReceived, createApplicationItem, applicationItemCreated)

import Data.FileEntry exposing (FileEntry)

port requestFolderSelect : () -> Cmd msg
port confirmFolder : String -> Cmd msg
port navigateToPath : List String -> Cmd msg
port createApplicationItem : { path : List String, filename : String, content : String } -> Cmd msg

port folderPicked : ({ name : String } -> msg) -> Sub msg
port folderContentReceived : ({ path : List String, files : List FileEntry, rootName : String, rootRealName : String } -> msg) -> Sub msg
port applicationItemCreated : (Bool -> msg) -> Sub msg
