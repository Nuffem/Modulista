port module Main exposing (main)

import Browser
import Browser.Navigation as Nav
import Html exposing (..)
import Html.Attributes exposing (style, class, href)
import Html.Events exposing (onClick)
import Url

-- MAIN

main : Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = LinkClicked
        }

-- PORTS

port requestFolderSelect : () -> Cmd msg
port confirmFolder : () -> Cmd msg
port navigateToPath : List String -> Cmd msg
port folderPicked : ({ name : String } -> msg) -> Sub msg
port folderContentReceived : ({ path : List String, files : List FileEntry, rootName : String } -> msg) -> Sub msg

-- MODEL

type alias FileEntry =
    { name : String
    , isFolder : Bool
    }

type alias Model =
    { key : Nav.Key
    , url : Url.Url
    , count : Int
    , currentPath : List String
    , files : List FileEntry
    , rootFolderName : Maybe String
    , pendingFolderName : Maybe String
    , isLoading : Bool
    }

init : () -> Url.Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url key =
    let
        path = parsePath url
    in
    ( { key = key
      , url = url
      , count = 0
      , currentPath = path
      , files = []
      , rootFolderName = Nothing
      , pendingFolderName = Nothing
      , isLoading = False
      }
    , navigateToPath path
    )

parsePath : Url.Url -> List String
parsePath url =
    case url.fragment of
        Just fragment ->
             fragment
                |> String.split "/"
                |> List.filter (not << String.isEmpty)
        Nothing ->
            []

-- UPDATE

type Msg
    = Increment
    | Decrement
    | LinkClicked Browser.UrlRequest
    | UrlChanged Url.Url
    | RequestFolderSelect
    | FolderPicked { name : String }
    | ConfirmSelection
    | FolderContentReceived { path : List String, files : List FileEntry, rootName : String }

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }, Cmd.none )

        Decrement ->
            ( { model | count = model.count - 1 }, Cmd.none )

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

-- VIEW

view : Model -> Browser.Document Msg
view model =
    { title = "Modulista SPA"
    , body =
        [ div [ style "display" "flex", style "flex-direction" "column", style "min-height" "100vh", style "font-family" "sans-serif" ]
            [ header
                [ style "background-color" "#2563EB" -- Royal Blue
                , style "color" "white"
                , style "padding" "1rem 1.5rem"
                , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
                , style "display" "flex"
                , style "align-items" "center"
                ]
                [ h1
                    [ style "margin" "0"
                    , style "font-size" "1.5rem"
                    , style "font-weight" "600"
                    ]
                    [ text "Modulista" ]
                ]
            , main_
                [ style "padding" "2rem"
                , style "flex" "1"
                , style "background-color" "#F3F4F6"
                , style "width" "100%"
                , style "max-width" "80vh"
                , style "margin" "0 auto"
                ]
                [ div [ style "background" "white", style "padding" "2rem", style "border-radius" "0.5rem", style "box-shadow" "0 1px 3px rgba(0,0,0,0.1)" ]
                    [ h1 [ style "margin-top" "0", style "color" "#111827" ] [ text "Bem-vindo ao Modulista (Elm)" ]
                    , p [ style "color" "#4B5563" ] [ text "Este é um ambiente de desenvolvimento Elm configurado via Containerfile." ]
                    , div [ style "margin-top" "1.5rem", style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
                        [ button
                            [ onClick Decrement
                            , style "padding" "0.5rem 1rem"
                            , style "background-color" "#E5E7EB"
                            , style "border" "none"
                            , style "border-radius" "0.25rem"
                            , style "cursor" "pointer"
                            , style "font-size" "1rem"
                            , style "font-weight" "bold"
                            , style "color" "#374151"
                            ]
                            [ text "-" ]
                        , text (String.fromInt model.count)
                        , button
                            [ onClick Increment
                            , style "padding" "0.5rem 1rem"
                            , style "background-color" "#E5E7EB"
                            , style "border" "none"
                            , style "border-radius" "0.25rem"
                            , style "cursor" "pointer"
                            , style "font-size" "1rem"
                            , style "font-weight" "bold"
                            , style "color" "#374151"
                            ]
                            [ text "+" ]
                        ]
                    
                    -- File System Section
                    , div [ style "margin-top" "3rem", style "padding-top" "2rem", style "border-top" "2px solid #E5E7EB" ]
                        [ h2 [ style "margin-bottom" "1rem", style "color" "#111827" ] [ text "Navegador de Pastas" ]
                        , viewBreadcrumbs model
                        , viewFileList model
                        , div [ style "margin-top" "2rem", style "border-radius" "0.375rem", style "background" "#F3F4F6", style "padding" "1.5rem", style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
                            [ div [ style "display" "flex", style "flex-direction" "column", style "gap" "0.5rem" ]
                                [ label [ style "font-weight" "500", style "font-size" "0.875rem" ] [ text "Selecionar Pasta:" ]
                                , div [ style "display" "flex", style "align-items" "center", style "gap" "0.5rem" ]
                                     [ button 
                                        [ onClick RequestFolderSelect
                                        , style "padding" "0.5rem 1rem"
                                        , style "background-color" "white"
                                        , style "color" "#374151"
                                        , style "border" "1px solid #D1D5DB"
                                        , style "border-radius" "0.375rem"
                                        , style "cursor" "pointer"
                                        , style "font-weight" "500"
                                        ] 
                                        [ text "Escolher..." ]
                                     , span [ style "font-family" "monospace", style "color" "#4B5563" ]
                                        [ text (Maybe.withDefault "Nenhum selecionado" model.pendingFolderName) ]
                                     ]
                                ]
                            , button 
                                [ onClick ConfirmSelection
                                , style "padding" "0.75rem 1.5rem"
                                , style "background-color" (if model.pendingFolderName == Nothing then "#9CA3AF" else "#10B981")
                                , style "color" "white"
                                , style "border" "none"
                                , style "border-radius" "0.375rem"
                                , style "cursor" (if model.pendingFolderName == Nothing then "not-allowed" else "pointer")
                                , style "font-weight" "600"
                                , style "height" "fit-content"
                                , style "align-self" "flex-end"
                                ] 
                                [ text "Incluir" ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    }

viewBreadcrumbs : Model -> Html Msg
viewBreadcrumbs model =
    div [ style "margin-bottom" "1rem", style "padding" "0.5rem", style "background" "#F9FAFB", style "border" "1px solid #D1D5DB", style "border-radius" "0.375rem", style "font-family" "monospace" ]
        ( case model.rootFolderName of
            Nothing -> [ text "Selecione uma pasta para começar." ]
            Just root ->
                let
                    homeLink = a [ href "#/", style "color" "#2563EB", style "text-decoration" "none", style "font-weight" "bold" ] [ text root ]
                    
                    renderCrumb index name =
                        let
                            targetPath = List.take (index + 1) model.currentPath
                            hash = "#/" ++ String.join "/" targetPath
                        in
                        span []
                            [ text " / "
                            , a [ href hash, style "color" "#2563EB", style "text-decoration" "none" ] [ text name ]
                            ]
                in
                homeLink :: List.indexedMap renderCrumb model.currentPath
        )

viewFileList : Model -> Html Msg
viewFileList model =
    if model.rootFolderName == Nothing then
        div [] []
    else if List.isEmpty model.files then
        div [ style "padding" "1rem", style "color" "#666", style "font-style" "italic", style "text-align" "center", style "background" "#f9f9f9", style "border-radius" "0.25rem" ] 
            [ text "Pasta vazia." ]
    else
        div [ style "border" "1px solid #E5E7EB", style "border-radius" "0.5rem", style "overflow" "hidden" ]
            (List.map (viewFileEntry model.currentPath) model.files)

viewFileEntry : List String -> FileEntry -> Html Msg
viewFileEntry currentPath entry =
    let
         targetPath = currentPath ++ [ entry.name ]
         hash = "#/" ++ String.join "/" targetPath
         
         icon = if entry.isFolder then "📁" else "📄"
         
         content = 
            div [ style "display" "flex", style "align-items" "center", style "width" "100%" ]
                [ span [ style "margin-right" "0.75rem", style "font-size" "1.25rem" ] [ text icon ]
                , span [ style "font-weight" (if entry.isFolder then "600" else "400") ] [ text entry.name ]
                ]
    in
    if entry.isFolder then
        a [ href hash
          , style "display" "block"
          , style "padding" "0.75rem 1rem"
          , style "border-bottom" "1px solid #F3F4F6"
          , style "text-decoration" "none"
          , style "color" "#1F2937"
          , style "transition" "background-color 0.2s"
          -- hover style is hard in inline styles, ignoring for now
          ]
          [ content ]
    else
        div 
          [ style "padding" "0.75rem 1rem"
          , style "border-bottom" "1px solid #F3F4F6"
          , style "color" "#4B5563"
          ]
          [ content ]

subscriptions : Model -> Sub Msg
subscriptions _ =
    folderContentReceived FolderContentReceived
