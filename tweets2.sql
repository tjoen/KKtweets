/*
 Navicat Premium Data Transfer

 Source Server         : Local_copy
 Source Server Type    : MySQL
 Source Server Version : 50529
 Source Host           : 127.0.0.1
 Source Database       : KKtweets

 Target Server Type    : MySQL
 Target Server Version : 50529
 File Encoding         : utf-8

 Date: 05/28/2013 13:55:19 PM
*/

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `tweets`
-- ----------------------------
DROP TABLE IF EXISTS `tweets`;
CREATE TABLE `tweets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tweetID` bigint(20) NOT NULL,
  `date` text NOT NULL,
  `tweet` text NOT NULL,
  `thashtags` text NOT NULL,
  `tusernames` text NOT NULL,
  `source` text,
  `userID` bigint(20) NOT NULL,
  `userName` text NOT NULL,
  `name` text,
  `lang` text NOT NULL,
  `userfollowercount` text,
  `userstatuscount` text,
  `following` text,
  `retweet_count` text,
  `default_profile_image` text,
  `urls` text,
  `user_mentions` text,
  `hashtags` text,
  `in_reply_to_screen_name` text,
  `in_reply_to_user_id` text,
  `in_reply_to_status_id` text,
  `description` text,
  `retweeted` text,
  `geo` text,
  `latitude` text,
  `longitude` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tweetID` (`tweetID`),
  KEY `userID` (`userID`)
) ENGINE=MyISAM AUTO_INCREMENT=2359 DEFAULT CHARSET=utf8;


SET FOREIGN_KEY_CHECKS = 1;
