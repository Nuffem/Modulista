module View.Form exposing (view)

import Html exposing (..)
import Html.Attributes exposing (style, class, value, placeholder, type_)
import Html.Events exposing (onClick, onInput)
import Types exposing (Msg(..))

view : Maybe String -> String -> Html Msg
view pendingFolderName customNameInput =
    div [ style "margin-top" "2rem", style "border-radius" "0.5rem", style "background" "#F3F4F6", style "padding" "1.5rem", style "display" "flex", style "flex-direction" "column", style "gap" "1rem" ]
        [ div [ style "display" "flex", style "align-items" "center", style "gap" "1rem" ]
             [ button 
                [ onClick RequestFolderSelect
                , style "padding" "0.5rem"
                , style "background-color" "white"
                , style "color" "#374151"
                , style "border" "1px solid #D1D5DB"
                , style "border-radius" "0.375rem"
                , style "cursor" "pointer"
                , style "display" "flex"
                , style "align-items" "center"
                , style "justify-content" "center"
                , style "width" "2.5rem"
                , style "height" "2.5rem"
                , style "box-shadow" "0 1px 2px rgba(0,0,0,0.05)"
                , style "transition" "all 0.2s"
                , style "flex-shrink" "0"
                ] 
                [ span [ class "material-symbols-outlined" ] [ text "folder_open" ] ]
             , span [ style "font-family" "monospace", style "color" "#4B5563", style "font-size" "0.9rem" ]
                [ text (Maybe.withDefault "Nenhum selecionado" pendingFolderName) ]
             ]
        , case pendingFolderName of
            Just _ ->
                div [ style "display" "flex", style "align-items" "center", style "gap" "0.5rem", style "width" "100%" ]
                    [ input 
                        [ type_ "text"
                        , placeholder "Nome do item"
                        , value customNameInput
                        , onInput CustomNameChanged
                        , style "flex" "1"
                        , style "padding" "0.75rem"
                        , style "border" "1px solid #D1D5DB"
                        , style "border-radius" "0.375rem"
                        , style "font-size" "1rem"
                        , style "font-family" "inherit"
                        , style "outline" "none"
                        , style "box-shadow" "0 1px 2px rgba(0,0,0,0.05)"
                        ] 
                        []
                    , button 
                        [ onClick ConfirmSelection
                        , style "padding" "0"
                        , style "display" "flex"
                        , style "align-items" "center"
                        , style "justify-content" "center"
                        , style "background-color" "#10B981"
                        , style "color" "white"
                        , style "border" "none"
                        , style "border-radius" "0.375rem"
                        , style "width" "3rem"
                        , style "height" "3rem"
                        , style "cursor" "pointer"
                        , style "box-shadow" "0 2px 4px rgba(0,0,0,0.1)"
                        , style "transition" "background-color 0.2s"
                        , style "flex-shrink" "0"
                        ] 
                        [ span [ class "material-symbols-outlined" ] [ text "add" ] ]
                    ]
            Nothing ->
                text ""
        ]
