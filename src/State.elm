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
      , roots = []
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
            if List.isEmpty path then
                 ( { model | url = url, currentPath = [], files = model.roots, isLoading = False }
                 , Cmd.none
                 )
            else
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
            let
                -- Construct a FileEntry from the root name
                newRoot = { name = data.rootName, isFolder = True }
                
                -- Update roots list if this is a new root confirmed via "Include" workflow
                -- or if we just navigated to a root we know?
                -- Actually, simply ensuring it's in the list is safer.
                -- We only really "add" it when confirmed. But here we can just "ensure" it.
                updatedRoots = 
                    if List.member newRoot model.roots then
                        model.roots
                    else
                        model.roots ++ [newRoot]
            in
            ( { model 
              | files = data.files
              , currentPath = data.path
              , rootFolderName = Just data.rootName
              , pendingFolderName = Nothing
              , roots = updatedRoots
              , isLoading = False
              }
            , Cmd.none
            )

subscriptions : Model -> Sub Msg
subscriptions _ =
    folderContentReceived FolderContentReceived
