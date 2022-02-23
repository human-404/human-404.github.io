<?php

    ini_set('display_errors', 1); 
    ini_set('display_startup_errors', 1); 
    error_reporting(E_ALL);
    echo $_POST["table"];
    $table = json_decode($_POST["table"]); // table as list

    $filename = "data.csv";
    if (file_exists($filename)) {
        $file = fopen("data.csv", "w");

        // update the csv file
        foreach ($table as $line) {
            $a = array();
            array_push($a, html_entity_decode($line[0]), html_entity_decode($line[1]));
            fputcsv($file, $a);
        }

        fclose($file);
    } else {
        echo "the file is not present";
    }
?>