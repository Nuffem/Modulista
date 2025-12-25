module State exposing (init, update, subscriptions)

import Browser
import Browser.Navigation as Nav
import Url
import Types exposing (Model, Msg(..), ApplicationForm)
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
      , customNameInput = ""
      , isLoading = False
      , applicationForm = { name = "", functionType = "Soma", arguments = "", isOpen = False }
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
             ( { model | pendingFolderName = Just name, customNameInput = name, isLoading = False }, Cmd.none )

        CustomNameChanged newName ->
            ( { model | customNameInput = newName }, Cmd.none )

        ConfirmSelection ->
             ( { model | isLoading = True }, confirmFolder model.customNameInput )

        FolderContentReceived data ->
            let
                -- Construct a FileEntry from the root name
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

        OpenApplicationForm ->
            let
                currentForm = model.applicationForm
                newForm = { currentForm | isOpen = True, name = "", arguments = "" }
            in
            ( { model | applicationForm = newForm }, Cmd.none )

        CloseApplicationForm ->
            let
                currentForm = model.applicationForm
                newForm = { currentForm | isOpen = False }
            in
            ( { model | applicationForm = newForm }, Cmd.none )

        UpdateApplicationFormName name ->
            let
                currentForm = model.applicationForm
                newForm = { currentForm | name = name }
            in
            ( { model | applicationForm = newForm }, Cmd.none )

        UpdateApplicationFormFunction func ->
            let
                currentForm = model.applicationForm
                newForm = { currentForm | functionType = func }
            in
            ( { model | applicationForm = newForm }, Cmd.none )

        UpdateApplicationFormArguments args ->
            let
                currentForm = model.applicationForm
                newForm = { currentForm | arguments = args }
            in
            ( { model | applicationForm = newForm }, Cmd.none )

        SubmitApplicationForm ->
            let
                argsListString =
                    model.applicationForm.arguments
                    |> String.split ","
                    |> List.map String.trim
                    |> List.filter (not << String.isEmpty)
                    |> String.join ","

                -- Construct simplistic JSON for now
                jsonContent =
                    "{\"type\": \"Application\", \"function\": \"" ++ model.applicationForm.functionType ++ "\", \"arguments\": [" ++ argsListString ++ "]}"

                cmd = createApplicationItem
                        { path = model.currentPath
                        , filename = model.applicationForm.name ++ ".json"
                        , content = jsonContent
                        }
            in
            ( { model | isLoading = True }, cmd )

        ApplicationCreated success ->
            let
                 currentForm = model.applicationForm
                 newForm = { currentForm | isOpen = not success } -- Close if success
            in
            ( { model | isLoading = False, applicationForm = newForm }, Cmd.none )

subscriptions : Model -> Sub Msg

subscriptions _ =
    Sub.batch
        [ folderContentReceived FolderContentReceived
        , folderPicked FolderPicked
        , applicationItemCreated ApplicationCreated
        ]
