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
  PRIMARY KEY (`id_mensagem`),
  KEY `projeto_id` (`id_projeto`),
  CONSTRAINT `mensagem_chat_ibfk_1` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensagem_chat`
--

LOCK TABLES `mensagem_chat` WRITE;
/*!40000 ALTER TABLE `mensagem_chat` DISABLE KEYS */;
INSERT INTO `mensagem_chat` VALUES (1,1,'ALUN','Olá! Tudo bem?',NULL,'2025-05-19 15:25:29'),(3,10,'ALUN','Salve salve',NULL,'2025-05-20 10:35:27');
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensagem_chatbox`
--

LOCK TABLES `mensagem_chatbox` WRITE;
/*!40000 ALTER TABLE `mensagem_chatbox` DISABLE KEYS */;
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
  PRIMARY KEY (`id_projeto`),
  UNIQUE KEY `nm_projeto` (`nm_projeto`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto`
--

LOCK TABLES `projeto` WRITE;
/*!40000 ALTER TABLE `projeto` DISABLE KEYS */;
INSERT INTO `projeto` VALUES (1,'TCC Mentor','Uma plataforma para ajudar futuros formandos a progredir com o TCC.','Relatório Técnico',2,0,'tcc-mentor'),(10,'Testando','So um teste boy','Monografia',3,NULL,'testando');
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
  KEY `fk_projeto` (`id_projeto`),
  KEY `fk_usuario` (`id_aluno`),
  CONSTRAINT `fk_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projeto` (`id_projeto`),
  CONSTRAINT `fk_usuario` FOREIGN KEY (`id_aluno`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projeto_aluno`
--

LOCK TABLES `projeto_aluno` WRITE;
/*!40000 ALTER TABLE `projeto_aluno` DISABLE KEYS */;
INSERT INTO `projeto_aluno` VALUES (1,1,1),(9,10,7);
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Gustavo','ALUN','gustavin@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(2,'Joseffe Perigoso','ORIE','joseffeperigo@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(3,'Pupo','ORIE','pupopo@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(7,'Wellington','ALUN','wellwell@gmail.com','81dc9bdb52d04dc20036dbd8313ed055',NULL,NULL,NULL),(9,'Gustavo Garcia','ALUN','gustavorezende181@gmail.com','25d55ad283aa400af464c76d713c07ad',NULL,NULL,NULL);
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

-- Dump completed on 2025-05-26 14:35:23
