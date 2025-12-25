module State exposing (init, update, subscriptions)

import Browser
import Browser.Navigation as Nav
import Url
import Types exposing (Model, Msg(..))
import Ports exposing (..)
import Route exposing (parsePath)
import Json.Decode as Decode
import Data.FileEntry exposing (FileEntry)

init : Decode.Value -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    let
        path = parsePath url
        roots =
            case Decode.decodeValue rootsDecoder flags of
                Ok r -> r
                Err _ -> []

        initialFiles =
             if List.isEmpty path then
                 roots
             else
                 [] -- If we are deep, files will be loaded via navigateToPath
    in
    ( { key = key
      , url = url

      , currentPath = path
      , files = initialFiles
      , roots = roots
      , rootFolderName = Nothing
      , pendingFolderName = Nothing
      , customNameInput = ""
      , isLoading = False
      }
    , navigateToPath path
    )

rootsDecoder : Decode.Decoder (List FileEntry)
rootsDecoder =
    Decode.list rootDecoder

rootDecoder : Decode.Decoder FileEntry
rootDecoder =
    Decode.map2 (\name realName -> { name = name, isFolder = True, realName = Just realName })
        (Decode.field "name" Decode.string)
        (Decode.field "realName" Decode.string)

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
             ( { model | pendingFolderName = Just name, customNameInput = name, isLoading = False }, Cmd.none )

        CustomNameChanged newName ->
            ( { model | customNameInput = newName }, Cmd.none )

        ConfirmSelection ->
             ( { model | isLoading = True }, confirmFolder model.customNameInput )

        FolderContentReceived data ->
            let
                -- Construct a FileEntry from the root name with the real name
                newRoot = { name = data.rootName, isFolder = True, realName = Just data.rootRealName }
                
                -- Update roots list if this is a new root confirmed via "Include" workflow
                -- or if we just navigated to a root we know?
                -- Actually, simply ensuring it's in the list is safer.
                -- We only really "add" it when confirmed. But here we can just "ensure" it.
                updatedRoots = 
                    if List.member newRoot model.roots then
                        model.roots
                    else
                        -- Check if we already have a root with the same name but maybe missing realName (if that was possible)
                        -- or just update it. For now simple check.
                        -- Actually if we update the definition of FileEntry, List.member checks structural equality.
                        -- If realName is different, it will be added again. We might want to filter out old one with same name?
                        let 
                            others = List.filter (\r -> r.name /= newRoot.name) model.roots
                        in
                        others ++ [newRoot]

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
    Sub.batch
        [ folderContentReceived FolderContentReceived
        , folderPicked FolderPicked
        ]
