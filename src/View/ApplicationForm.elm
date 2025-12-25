module View.ApplicationForm exposing (view)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Types exposing (ApplicationForm, Msg(..))

view : ApplicationForm -> Html Msg
view form =
    if not form.isOpen then
        text ""
    else
        div [ style "position" "fixed", style "top" "0", style "left" "0", style "width" "100%", style "height" "100%", style "background-color" "rgba(0,0,0,0.5)", style "display" "flex", style "align-items" "center", style "justify-content" "center", style "z-index" "1000" ]
            [ div [ style "background" "white", style "padding" "2rem", style "border-radius" "0.5rem", style "width" "400px", style "box-shadow" "0 4px 6px rgba(0,0,0,0.1)" ]
                [ h2 [ style "margin-top" "0", style "margin-bottom" "1.5rem", style "font-size" "1.5rem", style "font-weight" "600" ] [ text "Nova Aplicação" ]
                , div [ style "margin-bottom" "1rem" ]
                    [ label [ style "display" "block", style "margin-bottom" "0.5rem", style "font-weight" "500" ] [ text "Nome do Item" ]
                    , input [ type_ "text", value form.name, onInput UpdateApplicationFormName, style "width" "100%", style "padding" "0.5rem", style "border" "1px solid #D1D5DB", style "border-radius" "0.25rem" ] []
                    ]
                , div [ style "margin-bottom" "1rem" ]
                    [ label [ style "display" "block", style "margin-bottom" "0.5rem", style "font-weight" "500" ] [ text "Função" ]
                    , select [ onInput UpdateApplicationFormFunction, value form.functionType, style "width" "100%", style "padding" "0.5rem", style "border" "1px solid #D1D5DB", style "border-radius" "0.25rem" ]
                        [ option [ value "Soma" ] [ text "Soma" ]
                        ]
                    ]
                , div [ style "margin-bottom" "1.5rem" ]
                    [ label [ style "display" "block", style "margin-bottom" "0.5rem", style "font-weight" "500" ] [ text "Argumentos (Números separados por vírgula)" ]
                    , input [ type_ "text", value form.arguments, onInput UpdateApplicationFormArguments, placeholder "Ex: 1, 2, 3", style "width" "100%", style "padding" "0.5rem", style "border" "1px solid #D1D5DB", style "border-radius" "0.25rem" ] []
                    ]
                , div [ style "display" "flex", style "justify-content" "flex-end", style "gap" "0.5rem" ]
                    [ button [ onClick CloseApplicationForm, style "padding" "0.5rem 1rem", style "background" "#E5E7EB", style "color" "#374151", style "border" "none", style "border-radius" "0.25rem", style "cursor" "pointer" ] [ text "Cancelar" ]
                    , button [ onClick SubmitApplicationForm, style "padding" "0.5rem 1rem", style "background" "#2563EB", style "color" "white", style "border" "none", style "border-radius" "0.25rem", style "cursor" "pointer" ] [ text "Criar" ]
                    ]
                ]
            ]
