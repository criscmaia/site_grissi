<?php require("includes/helpers.php"); ?>

<?php render("header", ["title" => "Contato"]); ?>

<div class="box">
    <div id="email_esquerda">
        <form method="post">
            <label for="nome">Nome: </label><br>
            <input type="text" name="nome" placeholder="Nome" id="nome-form" required autocomplete="name">
            <br><br>
            <label for="email">Email: </label><br />
            <input type="email" name="email" placeholder="Email" id="email-form" required autocomplete="email">
            <br><br>
            <label for="mensagem">Mensagem: </label><br>
            <textarea name="mensagem" rows="5" cols="40" placeholder="Deixe aqui sua mensagem =)" id="mensagem-form" required></textarea>
            <br><br>
            <input type="submit" name="submit" value="Enviar">
        </form>

        <?php
        $nome = $_POST['nome'];
        $email = $_POST['email'];
        $mensagem = $_POST['mensagem'];

        // Muda o fuso horário pro Brasil, e pega a data atual
        setlocale(LC_TIME, 'ptb', 'pt_BR', 'portuguese-brazil', 'bra', 'brazil', 'pt_BR.utf-8', 'pt_BR.iso-8859-1','br','portuguese');
        date_default_timezone_set("Brazil/East");
        $data = strftime("%d de %B de %Y");
        $hora=getdate(date("U"));
        $hora = strftime("%H:%M");
        $data_completa = "$data - $hora";

        if (isset($_REQUEST['email'])) {                                                     // chama função do email
            if (empty($nome) || empty($email) || empty($mensagem )){                         // se algum campo vazio
                echo ("<h2>Favor preencher todos os campos.</h2>\n\n Mensagem n&atilde;o enviada.");
            }
            else {
                if (!$email == "" && (!strstr($email,"@") || !strstr($email,"."))){          // se email for inválido
                    echo "<h2>Email inv&aacute;lido.</h2>\n\n Mensagem n&atilde;o enviada.";
                }
                else {
                    if (eregi('http:', $mensagem)){                                         // se tiver link na mensagem
                        echo "<h2>N&atilde;o &eacute; permitido o envio de links.</h2>\n\n Mensagem n&atilde;o enviada.";
                    }
                    else {
                        //--------------- COMEÇA A ENVIAR O EMAIL ---------------//
                                $httprefi = getenv ("HTTP_REFERER");
                                $httpagenti = getenv ("HTTP_USER_AGENT");

                                $extra = stripcslashes($extra);
                                $extra = "Informações adicionais: \n
                                          Enviado do site: $httprefi \n
                                          Usando o navegador: $httpagenti \n
                                         ";

                                $mensagem = stripcslashes($mensagem);
                                $mensagem = " $data_completa \n
                                              De: $nome ($email)\n
                                              Mensagem: $mensagem \n
                                            ";

                                $email_completo = "$mensagem $extra";

                                $from = "De: $nome ($email)";

                                mail("criscmaia@gmail.com", "Site Grissi", $email_completo, $from);

                                echo "Mensagem enviada! \n";
                                echo "Obrigado pela participa&ccedil&atilde;o.";
                        //--------------- TERMINA DE ENVIAR O EMAIL ---------------//
                    }
                }
            }
        }


        ?>
    </div>
    <div id="email_direita">
        <img src="images/contato/arroba.png" alt="email" height="150px" width="150px" />
    </div>
</div>

<?php render("footer"); ?>
