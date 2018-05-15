rm(list=ls())
library(tidyr)
library(dplyr)
library(purrr)
library(readr)
library(ggplot2)
library(scales)

source("R/format_si.R")
source("R/loadAllFiles.R")
source("R/cleanupData.R")
source("R/tidyData.R")
source("R/plotApproaches.R")


#input dir
csvDir = "/input/"

#output dir for plots
plotsDir = "/out/"

data <- loadAllFiles(csvDir)
data <- cleanupData(data)
tidy <- newTidyData(data)

plotApproaches(tidy)
