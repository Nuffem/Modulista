port module Ports exposing (requestFolderSelect, confirmFolder, navigateToPath, folderPicked, folderContentReceived)

import Data.FileEntry exposing (FileEntry)

port requestFolderSelect : () -> Cmd msg
port confirmFolder : String -> Cmd msg
port navigateToPath : List String -> Cmd msg
port folderPicked : ({ name : String } -> msg) -> Sub msg
port folderContentReceived : ({ path : List String, files : List FileEntry, rootName : String } -> msg) -> Sub msg
