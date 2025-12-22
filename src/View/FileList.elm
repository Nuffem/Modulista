module View.FileList exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, class, href)
import Data.FileEntry exposing (FileEntry)
import View.Utils exposing (buildHash)

view : List String -> List FileEntry -> Html msg
view currentPath files =
    if List.isEmpty files then
        if List.isEmpty currentPath then
             div [ style "padding" "2rem", style "color" "#6B7280", style "text-align" "center", style "background" "#F9FAFB", style "border" "1px dashed #D1D5DB", style "border-radius" "0.5rem", style "flex" "1" ] 
                [ span [ class "material-symbols-outlined", style "font-size" "3rem", style "margin-bottom" "1rem", style "display" "block" ] [ text "folder_open" ]
                , text "Selecione uma pasta para começar." 
                ]
        else
             div [ style "padding" "1rem", style "color" "#666", style "font-style" "italic", style "text-align" "center", style "background" "#f9f9f9", style "border-radius" "0.25rem", style "flex" "1" ] 
                [ text "Pasta vazia." ]
    else
        div [ style "border" "1px solid #E5E7EB", style "border-radius" "0.5rem", style "overflow-y" "auto", style "flex" "1", style "min-height" "0" ]
            (List.map (viewFileEntry currentPath) files)

viewFileEntry : List String -> FileEntry -> Html msg
viewFileEntry currentPath entry =
    let
         targetPath = currentPath ++ [ entry.name ]
         hash = buildHash targetPath
         
         iconName = if entry.isFolder then "folder" else "article"
         
         content = 
            div [ style "display" "flex", style "align-items" "center", style "width" "100%" ]
                [ span [ class "material-symbols-outlined", style "margin-right" "0.75rem", style "font-size" "1.5rem", style "color" (if entry.isFolder then "#F59E0B" else "#9CA3AF") ] [ text iconName ]
                , div [ style "display" "flex", style "flex-direction" "column" ]
                    [ span [ style "font-weight" (if entry.isFolder then "600" else "400") ] [ text entry.name ]
                    , case entry.realName of
                        Just real ->
                             if real /= entry.name then
                                 span [ style "font-size" "0.75rem", style "color" "#6B7280" ] [ text real ]
                             else
                                 text ""
                        Nothing ->
                             text ""
                    ]
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
          ]
          [ content ]
    else
        div 
          [ style "padding" "0.75rem 1rem"
          , style "border-bottom" "1px solid #F3F4F6"
          , style "color" "#4B5563"
          ]
          [ content ]
