<?php 
    $paginaaberta = $_SERVER['REQUEST_URI']; //pega a página aberta e salva
?>

<div id="navcontainer">
    <ul id="navlist">

        <li>|<a href="index.php?link=home" 
	    <?php if ($paginaaberta =='/index.php?link=home')       echo 'id="current"'; ?>
	> P&aacute;gina Principal</a> |</li>

    	<li><a href="index.php?link=arvore"
	    <?php if ($paginaaberta =='/index.php?link=arvore')     echo 'id="current"'; ?>
	> &Aacute;rvore Geneal&oacute;gica</a> |</li>

	<li><a href="index.php?link=historia"
	    <?php if ($paginaaberta =='/index.php?link=historia')   echo 'id="current"'; ?>
	> Hist&oacute;ria</a> |</li>

	<li><a href="index.php?link=lembrancas"
	    <?php if ($paginaaberta =='/index.php?link=lembrancas') echo 'id="current"'; ?>
	> Lembran&ccedil;as</a> |</li>

	<li><a href="index.php?link=negocios"
	    <?php if ($paginaaberta =='/index.php?link=negocios')   echo 'id="current"'; ?>
	> Neg&oacute;cios</a> |</li>

	<li><a href="index.php?link=noticias"
	    <?php if ($paginaaberta =='/index.php?link=noticias')   echo 'id="current"'; ?>
	> Noticias</a> |</li>

	<li><a href="index.php?link=fotos"
	    <?php if ($paginaaberta =='/index.php?link=fotos')      echo 'id="current"'; ?>
	> Fotos</a> |</li>

	<li><a href="index.php?link=contato"
	    <?php if ($paginaaberta =='/index.php?link=contato')    echo 'id="current"'; ?>
	> Contato</a> |</li>

    </ul>
</div>