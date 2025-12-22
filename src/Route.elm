module Route exposing (parsePath)

import Url

parsePath : Url.Url -> List String
parsePath url =
    case url.fragment of
        Just fragment ->
            fragment
                |> String.split "/"
                |> List.filter (not << String.isEmpty)
                |> List.filterMap Url.percentDecode
        Nothing ->
            []
