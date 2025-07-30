<?php require("includes/helpers.php"); ?>

<?php render("header", ["title" => "Árvore Genealógica"]); ?>
<!-- botão de pesquisar! -->
<script type="text/javascript" id="cool_find_script" src="/js/find6.js"></script>

<?php
// diretório das imagens
$diretorio = "./images/arvore/*.jpg";

// array imagens salva o caminho dos arquivos
$imagens=glob($diretorio);
$caminho=$imagens;
$nome=$imagens;

// substitui o diretório e a extensão por | pra ser delimitador
$img_search = array("./images/arvore/",".jpg");
$imagens=str_ireplace($img_search,"|",$imagens);

// deixa o nome puro
$nome_search = array("./images/arvore/",".jpg");
$nome=str_ireplace($nome_search,"",$nome);

// pega todos os dados do arquivo da árvore
$data=file_get_contents('./arvore.html');

//conta quantos valores no array
$i = count($imagens)-1;

do
  {
	//Nome do arquivo vira uppercase
	$imagens[$i] = strtoupper($imagens[$i]);

	// nome da pessoa vira uppercase
	$nome[$i] = strtoupper($nome[$i]);

	//cria uma variável com o que vai substituir
	$replace ='
		<img src="./images/arvore/camera.png" alt="camera" class="icone">
		<a href="#foto" class="tooltip">'.$nome[$i].'<span class="foto"><img src="'.("./images/arvore/".rawurlencode($nome[$i]).".jpg").'" alt="'.$nome[$i].'"/></span></a>';

	//substitui procurando pelo array[$i]
	$data = preg_replace ($imagens[$i], $replace, $data);

	$i--;
  }
while ($i>0);

echo $data;

?>

    <?php render("footer"); ?>
