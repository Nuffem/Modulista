module View.Utils exposing (buildHash)

import Url

buildHash : List String -> String
buildHash path =
    "#/" ++ (path |> List.map Url.percentEncode |> String.join "/")
