-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: tcc_mentor
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `mensagem_chat`
--

DROP TABLE IF EXISTS `mensagem_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensagem_chat` (
  `id_mensagem` int(11) NOT NULL AUTO_INCREMENT,
  `id_projeto` int(11) NOT NULL,
  `remetente` enum('ALUN','ORIE','IA') DEFAULT NULL,
  `mensagem` text DEFAULT NULL,
  `arquivo_pdf` varchar(255) DEFAULT NULL,
  `data_envio` datetime DEFAULT current_timestamp(),
  `id_remetente` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_mensagem`),
  KEY `projeto_id` (`id_projeto`),
  KEY `fk_id_remetente` (`id_remetente`),
  CONSTRAINT `fk_id_remetente` FOREIGN KEY (`id_remetente`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `mensagem_chat_ibfk_1` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensagem_chat`
--

LOCK TABLES `mensagem_chat` WRITE;
/*!40000 ALTER TABLE `mensagem_chat` DISABLE KEYS */;
INSERT INTO `mensagem_chat` VALUES (1,1,'ALUN','Olá! Tudo bem?',NULL,'2025-05-19 15:25:29',1),(91,1,'ORIE','Ficou bem bom! Mas a parte do login eu achei pessimo, melhorem ali',NULL,'2025-05-27 13:36:41',2),(131,1,'IA','Resposta negativa. O professor considerou a implementação do login insatisfatória, indicando a necessidade de melhorias significativas nessa parte específica do TCC.\n\nPara resolver:\n*   **Identifique os problemas:** Descubra o que exatamente o professor não gostou no login. Pode ser a interface, a segurança, a usabilidade, etc.\n*   **Refaça o login:** Com base no feedback, redesenhe e reimplemente o sistema de login, focando em resolver os problemas apontados.\n*   **Teste:** Certifique-se de que o novo sistema de login funciona corretamente e é fácil de usar.\n*   **Apresente:** Mostre a nova versão ao professor para obter feedback adicional.',NULL,'2025-06-07 15:16:08',NULL);
/*!40000 ALTER TABLE `mensagem_chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensagem_chatbox`
--

DROP TABLE IF EXISTS `mensagem_chatbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensagem_chatbox` (
  `id_mensagem` int(11) NOT NULL AUTO_INCREMENT,
  `id_projeto` int(11) NOT NULL,
  `resumo` text NOT NULL,
  `data_envio` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_mensagem`),
  KEY `fk_mensagem_projeto` (`id_projeto`),
  CONSTRAINT `fk_mensagem_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensagem_chatbox`
--

LOCK TABLES `mensagem_chatbox` WRITE;
/*!40000 ALTER TABLE `mensagem_chatbox` DISABLE KEYS */;
INSERT INTO `mensagem_chatbox` VALUES (32,1,'Tessy é uma IA para TCCs. Para ajudar a encontrar um tema interessante, ela sugere começar explorando as áreas do curso que mais interessam ao aluno. Pergunta se há alguma disciplina ou assunto que chama mais atenção.\n','2025-06-06 17:00:39'),(33,1,'Tessy é uma IA para TCCs. Para ajudar a encontrar um tema interessante, ela sugere começar explorando as áreas do curso que mais interessam ao aluno. Pergunta se há alguma área de interesse dentro do curso.\n','2025-06-06 17:23:00'),(34,1,'Tessy é uma IA para TCCs. O aluno mencionou \"paçoca\" como área de interesse. Tessy sugere temas relacionados a alimentos, nutrição, história e cultura da paçoca no Brasil. Pergunta se o aluno gostaria de focar em aspectos como benefícios nutricionais, impacto cultural ou novas formas de produção e consumo.\n','2025-06-06 17:23:22'),(35,30,'O aluno mencionou \"paçoca\" como área de interesse. Tessy sugere temas relacionados a alimentos, nutrição, história e cultura da paçoca no Brasil. Pergunta se o aluno gostaria de focar em aspectos como benefícios nutricionais, impacto cultural ou novas formas de produção e consumo. Adicionalmente, Tessy pergunta sobre as áreas do curso que o aluno mais gosta, procurando por disciplinas ou temas de maior interesse.\n','2025-06-06 18:06:21');
/*!40000 ALTER TABLE `mensagem_chatbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projeto`
--

DROP TABLE IF EXISTS `projeto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projeto` (
  `id_projeto` int(11) NOT NULL AUTO_INCREMENT,
  `nm_projeto` varchar(60) NOT NULL,
  `dc_projeto` text DEFAULT NULL,
  `tp_projeto` varchar(30) NOT NULL,
  `id_orientador` int(11) NOT NULL,
  `id_coorientador` int(11) DEFAULT NULL,
  `url` varchar(100) DEFAULT NULL,
  `voto_deletar` int(1) DEFAULT 0,
  PRIMARY KEY (`id_projeto`),
  UNIQUE KEY `nm_projeto` (`nm_projeto`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto`
--

LOCK TABLES `projeto` WRITE;
/*!40000 ALTER TABLE `projeto` DISABLE KEYS */;
INSERT INTO `projeto` VALUES (1,'TCC Mentor','Uma plataforma para ajudar futuros formandos a progredir com o TCC.','Relatório Técnico',2,0,'tcc-mentor',0),(28,'dfgdfgdsfgdsfg','sdfgsdfgdfsgdsfg','Monografia',2,NULL,'dfgdfgdsfgdsfg',0),(30,'Perigosetes','Periculosidade a mil','Monografia',2,NULL,'perigosetes',0);
/*!40000 ALTER TABLE `projeto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projeto_aluno`
--

DROP TABLE IF EXISTS `projeto_aluno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projeto_aluno` (
  `id_projeto_aluno` int(11) NOT NULL AUTO_INCREMENT,
  `id_projeto` int(11) NOT NULL,
  `id_aluno` int(11) NOT NULL,
  PRIMARY KEY (`id_projeto_aluno`),
  KEY `fk_usuario` (`id_aluno`),
  KEY `fk_projeto` (`id_projeto`),
  CONSTRAINT `fk_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario` FOREIGN KEY (`id_aluno`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto_aluno`
--

LOCK TABLES `projeto_aluno` WRITE;
/*!40000 ALTER TABLE `projeto_aluno` DISABLE KEYS */;
INSERT INTO `projeto_aluno` VALUES (23,1,1),(40,28,7),(42,30,15),(43,30,16);
/*!40000 ALTER TABLE `projeto_aluno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nm_usuario` varchar(60) NOT NULL,
  `cargo` enum('ALUN','ORIE','CORI') NOT NULL,
  `email` varchar(70) NOT NULL,
  `senha` varchar(45) NOT NULL,
  `token` varchar(40) DEFAULT NULL,
  `token_expira` datetime DEFAULT NULL,
  `token_recuperacao` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Gustavo','ALUN','gustavin@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(2,'Joseffe Perigoso','ORIE','joseffeperigo@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(3,'Pupo','ORIE','pupopo@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(7,'Wellington','ALUN','wellwell@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(9,'Gustavo Garcia','ALUN','gustavorezende181@gmail.com','25d55ad283aa400af464c76d713c07ad',NULL,'2025-06-06 21:14:12','483e7b5676078674cd6e7e8c73eb9162582751d8'),(14,'Silvana','ALUN','silvanarcorretora@gmail.com','25d55ad283aa400af464c76d713c07ad','ff666131ce27f4076b420ad34b00351931f79ea4',NULL,NULL),(15,'Heitor Pedro de Godoi','ALUN','','25d55ad283aa400af464c76d713c07ad','33a2044bce57905cae79543b02ffd22d723e6da5',NULL,NULL),(16,'Heitor Pedro de Godoi','ALUN','heitorpedrodegodoi@gmail.com','25d55ad283aa400af464c76d713c07ad','6e9f90deda7f40f6079dc42c85cdb63c045788ed',NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-07 15:23:06
