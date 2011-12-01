<?php

$url = $_GET['url'];

if ($data = @file_get_contents($url))
{
    header('Content-Type: text/xml');
    echo $data;
}
else
{
	header("HTTP/1.0 404 Not Found");
    echo '{error: {id: "error_fetching", msg: "Error Fetching data"}}';
}


?> 
