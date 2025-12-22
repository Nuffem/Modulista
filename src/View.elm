module View exposing (view)

import Browser
import Html exposing (..)
import Html.Attributes exposing (style, class, href, src, alt)
import Html.Events exposing (onClick)
import Types exposing (Model, Msg(..))
import Data.FileEntry exposing (FileEntry)

view : Model -> Browser.Document Msg
view model =
    { title = "Modulista"
    , body =
        [ div [ style "display" "flex", style "flex-direction" "column", style "height" "100vh", style "overflow" "hidden" ]
            [ header
                [ style "background-color" "#2563EB" -- Royal Blue
                , style "color" "white"
                , style "padding" "1rem 1.5rem"
                , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
                , style "display" "flex"
                , style "align-items" "center"
                , style "gap" "1rem"
                ]
                [ img
                    [ src "logo.svg"
                    , alt "Modulista Logo"
                    , style "height" "32px"
                    , style "width" "32px"
                    ]
                    []
                , h1
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
                , style "display" "flex"
                , style "flex-direction" "column"
                , style "overflow" "hidden"
                , style "box-sizing" "border-box"
                ]
                [ div [ style "background" "white", style "padding" "2rem", style "border-radius" "0.5rem", style "box-shadow" "0 1px 3px rgba(0,0,0,0.1)", style "display" "flex", style "flex-direction" "column", style "flex" "1", style "overflow" "hidden" ]
                    [ viewBreadcrumbs model
                    , viewFileList model
                    , if List.isEmpty model.currentPath then
                        div [ style "margin-top" "2rem", style "border-radius" "0.375rem", style "background" "#F3F4F6", style "padding" "1.5rem", style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
                            [ div [ style "display" "flex", style "flex-direction" "column", style "gap" "0.5rem" ]
                                [ div [ style "display" "flex", style "align-items" "center", style "gap" "0.5rem" ]
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
                      else
                        text ""
                    ]
                ]
            ]
        ]
    }

viewBreadcrumbs : Model -> Html Msg
viewBreadcrumbs model =
    let
        crumbStyle =
            [ style "display" "inline-flex"
            , style "align-items" "center"
            , style "padding" "0.5rem 1rem"
            , style "background-color" "white"
            , style "border" "1px solid #E5E7EB"
            , style "border-radius" "9999px"
            , style "color" "#374151"
            , style "text-decoration" "none"
            , style "font-size" "0.875rem"
            , style "font-weight" "500"
            , style "transition" "all 0.2s"
            , style "box-shadow" "0 1px 2px rgba(0,0,0,0.05)"
            , style "cursor" "pointer"
            ]

        separator =
            span [ class "material-symbols-outlined", style "color" "#9CA3AF", style "font-size" "1.25rem" ] 
                [ text "chevron_right" ]

        homeLink = 
            a (href "#/" :: crumbStyle)
                [ span [ class "material-symbols-outlined", style "font-size" "1.25rem", style "margin-right" "0.25rem" ] [ text "home" ]
                , text "Início" 
                ]
        
        renderCrumb index name =
            let
                targetPath = List.take (index + 1) model.currentPath
                hash = "#/" ++ String.join "/" targetPath
            in
            [ separator
            , a (href hash :: crumbStyle) [ text name ]
            ]
    in
    div [ style "margin-bottom" "1rem", style "display" "flex", style "align-items" "center", style "flex-wrap" "wrap", style "gap" "0.5rem" ]
        (homeLink :: List.concat (List.indexedMap renderCrumb model.currentPath))

viewFileList : Model -> Html Msg
viewFileList model =
    if List.isEmpty model.files then
        if List.isEmpty model.currentPath then
             div [ style "padding" "2rem", style "color" "#6B7280", style "text-align" "center", style "background" "#F9FAFB", style "border" "1px dashed #D1D5DB", style "border-radius" "0.5rem", style "flex" "1" ] 
                [ span [ class "material-symbols-outlined", style "font-size" "3rem", style "margin-bottom" "1rem", style "display" "block" ] [ text "folder_open" ]
                , text "Selecione uma pasta para começar." 
                ]
        else
             div [ style "padding" "1rem", style "color" "#666", style "font-style" "italic", style "text-align" "center", style "background" "#f9f9f9", style "border-radius" "0.25rem", style "flex" "1" ] 
                [ text "Pasta vazia." ]
    else
        div [ style "border" "1px solid #E5E7EB", style "border-radius" "0.5rem", style "overflow-y" "auto", style "flex" "1", style "min-height" "0" ]
            (List.map (viewFileEntry model.currentPath) model.files)

viewFileEntry : List String -> FileEntry -> Html Msg
viewFileEntry currentPath entry =
    let
         targetPath = currentPath ++ [ entry.name ]
         hash = "#/" ++ String.join "/" targetPath
         
         iconName = if entry.isFolder then "folder" else "article"
         
         content = 
            div [ style "display" "flex", style "align-items" "center", style "width" "100%" ]
                [ span [ class "material-symbols-outlined", style "margin-right" "0.75rem", style "font-size" "1.5rem", style "color" (if entry.isFolder then "#F59E0B" else "#9CA3AF") ] [ text iconName ]
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
