module View exposing (view)

import Browser
import Html exposing (div, main_, text, span)
import Html.Attributes exposing (style)
import Types exposing (Model, Msg(..))
import View.Header
import View.Breadcrumbs
import View.FileList
import View.Form
import View.ApplicationForm
import Html.Events exposing (onClick)

view : Model -> Browser.Document Msg
view model =
    { title = "Modulista"
    , body =
        [ div [ style "display" "flex", style "flex-direction" "column", style "height" "100vh", style "overflow" "hidden" ]
            [ View.Header.view
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
                    [ div [ style "display" "flex", style "justify-content" "space-between", style "align-items" "center" ]
                        [ View.Breadcrumbs.view model.currentPath
                        , if not (List.isEmpty model.currentPath) then
                            div [ onClick OpenApplicationForm, style "cursor" "pointer", style "display" "flex", style "align-items" "center", style "color" "#2563EB", style "font-weight" "500", style "font-size" "0.9rem" ]
                                [ span [ Html.Attributes.class "material-symbols-outlined", style "margin-right" "0.25rem" ] [ text "add" ]
                                , text "Nova Aplicação"
                                ]
                          else
                            text ""
                        ]
                    , View.FileList.view model.currentPath model.files
                    , if List.isEmpty model.currentPath then
                        View.Form.view model.pendingFolderName model.customNameInput
                      else
                        text ""
                    ]
                ]
            , View.ApplicationForm.view model.applicationForm
            ]
        ]
    }
