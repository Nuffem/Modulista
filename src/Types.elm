module Types exposing (Model, Msg(..), ApplicationForm)

import Browser
import Browser.Navigation as Nav
import Url
import Data.FileEntry exposing (FileEntry)

type alias Model =
    { key : Nav.Key
    , url : Url.Url
    , currentPath : List String
    , files : List FileEntry
    , roots : List FileEntry
    , rootFolderName : Maybe String
    , pendingFolderName : Maybe String
    , customNameInput : String
    , isLoading : Bool
    , applicationForm : ApplicationForm
    }

type alias ApplicationForm =
    { name : String
    , functionType : String
    , arguments : String
    , isOpen : Bool
    }

type Msg
    = LinkClicked Browser.UrlRequest
    | UrlChanged Url.Url
    | RequestFolderSelect
    | FolderPicked { name : String }
    | CustomNameChanged String
    | ConfirmSelection
    | FolderContentReceived { path : List String, files : List FileEntry, rootName : String, rootRealName : String }
    | OpenApplicationForm
    | CloseApplicationForm
    | UpdateApplicationFormName String
    | UpdateApplicationFormFunction String
    | UpdateApplicationFormArguments String
    | SubmitApplicationForm
    | ApplicationCreated Bool
