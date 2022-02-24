<?php

    ini_set('display_errors', 1); 
    ini_set('display_startup_errors', 1); 
    error_reporting(E_ALL);
    $table = json_decode($_POST["table"]); // table as list

    if (is_null($table) || sizeof($table) == 0) {} 
    else {
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
            header("Refresh:0; url=editor.html");
        } else {
            echo "the file is not present";
        }
    }
?>