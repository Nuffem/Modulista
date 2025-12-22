module State exposing (init, update, subscriptions)

import Browser
import Browser.Navigation as Nav
import Url
import Types exposing (Model, Msg(..))
import Ports exposing (..)
import Route exposing (parsePath)

init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    let
        path = parsePath url
    in
    ( { key = key
      , url = url

      , currentPath = path
      , files = []
      , rootFolderName = Nothing
      , pendingFolderName = Nothing
      , isLoading = False
      }
    , navigateToPath path
    )

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Nav.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        UrlChanged url ->
            let
                path = parsePath url
            in
            ( { model | url = url, currentPath = path, isLoading = True }
            , navigateToPath path
            )

        RequestFolderSelect ->
            ( { model | isLoading = True }
            , requestFolderSelect ()
            )

        FolderPicked { name } ->
             ( { model | pendingFolderName = Just name, isLoading = False }, Cmd.none )

        ConfirmSelection ->
             ( { model | isLoading = True }, confirmFolder () )

        FolderContentReceived data ->
            ( { model 
              | files = data.files
              , currentPath = data.path
              , rootFolderName = Just data.rootName
              , pendingFolderName = Nothing
              , isLoading = False
              }
            , Cmd.none
            )

subscriptions : Model -> Sub Msg
subscriptions _ =
    folderContentReceived FolderContentReceived
