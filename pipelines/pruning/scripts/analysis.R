library(tidyr)
library(dplyr)
library(purrr)
library(readr)
library(ggplot2)
library(scales)

#input dir
csvDir = "/input/"

#output dir for plots
plotsDir = "/out/"

data <-
  list.files(path = csvDir, pattern="result-*", full.names = T)  %>% 
  map_df(function(x) read_csv(x ,col_names = c("globalClock", "actorId", "actorClock", "command", "event", "checkpoint"), 
                              col_types = cols("actorId" = col_character())) %>% mutate(rowNr = n(), filename=gsub(".csv","",basename(x)))) %>%   #rowNr: number of line
  separate(filename, c("skip1","approachName","params","step","workloadId","maxglcx"), "-", remove =T ) %>%                            #extract values from filename
  separate(workloadId, c("skip2","workload","iteration"), "_", remove =T ) %>%
  select(-one_of("skip1","skip2"))


data$step <- as.numeric(data$step) 
data$approach = paste(data$approachName," ",data$params) #approach as combination of name and parameters
data$iteration = as.numeric(gsub(".txt","",data$iteration))


tidy <- data  %>%
  filter(iteration == 1) %>%
  group_by(workload,approach,step) %>%
  summarize(lastGlobalClock = max(globalClock), commandStorage = sum(command), eventStorage = sum(event), eventCheckpoint = sum(checkpoint), logEntries = max(rowNr)) 

tidy$reconstructible = tidy$logEntries/(1+tidy$lastGlobalClock)


format_si <- function(...) {
  # Format a vector of numeric values according
  # to the International System of Units.
  # http://en.wikipedia.org/wiki/SI_prefix
  #
  # Based on code by Ben Tupper
  # https://stat.ethz.ch/pipermail/r-help/2012-January/299804.html
  # Args:
  #   ...: Args passed to format()
  #
  # Returns:
  #   A function to format a vector of strings using
  #   SI prefix notation
  #
  
  function(x) {
    limits <- c(1e-24, 1e-21, 1e-18, 1e-15, 1e-12,
                1e-9,  1e-6,  1e-3,  1e0,   1e3,
                1e6,   1e9,   1e12,  1e15,  1e18,
                1e21,  1e24)
    prefix <- c("y",   "z",   "a",   "f",   "p",
                "n",   "µ",   "m",   " ",   "kB",
                "MB",   "GB",   "TB",   "PB",   "EB",
                "Z",   "Y")
    
    # Vector with array indices according to position in intervals
    i <- findInterval(abs(x), limits)
    
    # Set prefix to " " for very small values < 1e-24
    i <- ifelse(i==0, which(limits == 1e0), i)
    
    paste(format(round(x/limits[i], 1),
                 trim=TRUE, scientific=FALSE, ...),
          prefix[i])
  }
}




# Function for plotting all approaches and emiting two PDF plots
approach.graphs <- function(df, na.rm = TRUE, ...){
  approach_list <- unique(df$approach)  
  
  plotWidth = 40
  plotHeight = 22
  
  for (i in seq_along(approach_list)) { 
    
    storagePlot <- ggplot(subset(df,df$approach==approach_list[i]), aes(x=step)) +
      geom_point(aes(y=commandStorage, color="Commands"), shape = 1)  +
      geom_point(aes(y=eventStorage, color="Events"), shape = 2)  +
      geom_point(aes(y=eventCheckpoint, color="Checkpoints"), shape = 3)  +
      geom_point(aes(y=commandStorage+eventStorage+eventCheckpoint, color="Total"), shape = 4)  +
      geom_line(aes(y=commandStorage, color="Commands"))  +
      geom_line(aes(y=eventStorage, color="Events"))  +
      geom_line(aes(y=eventCheckpoint, color="Checkpoints"))  +
      geom_line(aes(y=commandStorage+eventStorage+eventCheckpoint, color="Total"))  +
      labs(title ="", x="", y="") +
      theme (
        axis.text.x=element_blank(),
        axis.ticks.x=element_blank(),
        legend.position = "bottom",
        legend.title = element_blank(),
        plot.margin=unit(c(0,0,0,0),"cm")
      )+ 
      guides(color=FALSE) +
      scale_x_continuous(
        limits =c(0,11),
        breaks = c(seq(1,10,1)),
        minor_breaks = NULL, #seq(1,9,2)
      ) +
      scale_y_continuous( labels=format_si()) 
    

        print(storagePlot)
    
    
    ggsave(paste("storageOverTime",gsub(" ", "",approach_list[i]),".pdf", sep=''), plot = last_plot(), device = "pdf", path = plotsDir,
           scale = 2, width = plotWidth, height =plotHeight, units = "mm",
           dpi = 300)
    
    reconsPlot <- ggplot(subset(df,df$approach==approach_list[i]), aes(x=step)) +
      geom_bar(aes(y=reconstructible), stat="identity") +
            labs(title ="", x="", y="") +
      theme (
        axis.text.x=element_text(angle=90),
        legend.position = "bottom",
        legend.title = element_blank(),,
        plot.margin=unit(c(0,0,0,0),"cm")
      )+ 
      scale_y_continuous(
          labels=percent,
          limits = c(0,1)
      ) +
      scale_x_continuous(
        limits =c(0,11),
        breaks = c(seq(1,10,1)),
        minor_breaks = NULL,
        labels = c("1" = "10%", "2" = "20%", "3" = "30%", "4" = "40%", "5" = "50%", "6" = "60%", "7" = "70%", "8" = "80%", "9" = "90%", "10" ="100%")
      )
    
    print(reconsPlot)
    
    
    ggsave(paste("reconstructabilityOverTime",gsub(" ", "",approach_list[i]),".pdf", sep=''), plot = last_plot(), device = "pdf", path = plotsDir,
           scale = 2, width = plotWidth, height =plotHeight, units = "mm",
           dpi = 300)
    
  }
  
}

approach.graphs(tidy)
