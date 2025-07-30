<?php
   function render($template, $data = [])
    {
        $path = "templates/" . $template . ".php";
        if (file_exists($path))
        {
            extract($data);
            require($path);
        }
    }

?>
