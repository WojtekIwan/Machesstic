-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Paź 15, 2026 at 10:35 AM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chess_db`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `chess_games`
--

CREATE TABLE `chess_games` (
  `id` varchar(36) NOT NULL,
  `user1` varchar(36) NOT NULL,
  `user1_color` varchar(5) NOT NULL,
  `user2` varchar(36) NOT NULL,
  `user2_color` varchar(5) NOT NULL,
  `moves` varchar(1000) NOT NULL,
  `winner` varchar(36) NOT NULL,
  `finished` tinyint(1) NOT NULL,
  `finish_reason` varchar(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `jwt_for_users`
--

CREATE TABLE `jwt_for_users` (
  `id` int(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `refresh_token` varchar(1000) NOT NULL,
  `verified` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user_additional_info`
--

CREATE TABLE `user_additional_info` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `profile_image_path` varchar(150) NOT NULL,
  `profile_note` varchar(50) NOT NULL,
  `maximal_elo` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user_basic_info`
--

CREATE TABLE `user_basic_info` (
  `id` varchar(36) NOT NULL,
  `username` varchar(15) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(1000) NOT NULL,
  `creation_date` date NOT NULL,
  `elo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
