<?php require("includes/helpers.php"); ?>

<?php render("header", ["title" => "Página Principal"]); ?>

<div class="home">
    <img src="images/home/grice2.JPG" alt="Foto" class="frame" width="680" height="478" />
</div>

<div class="homeaudio">
    <audio controls="true"><source src="/audio/funiculi_funicula.mp3" type="audio/mpeg" autoplay="autoplay" preload="auto"/></audio>
</div>

<?php render("footer"); ?>
