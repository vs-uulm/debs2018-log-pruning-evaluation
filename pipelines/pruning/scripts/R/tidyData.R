newTidyData <- function(data){
  tidy <- data  %>%
    group_by(workload,approach,step,iteration) %>%
    summarize(lastGlobalClock = max(globalClock), commandStorage = sum(command), eventStorage = sum(event), checkpointStorage = sum(checkpoint), logEntries = max(rowNr)) 

  tidy$reconstructible = tidy$logEntries/(1+tidy$lastGlobalClock)
  
  tidy <- tidy %>%
    group_by(workload,approach,step) %>%
    summarize(
      mean.reconstructible = mean(reconstructible, na.rm =T),
      sd.reconstructible = sd(reconstructible, na.rm =T),
      n.reconstructible = n(),

      mean.commandStorage = mean(commandStorage, na.rm =T),
      sd.commandStorage = sd(commandStorage, na.rm =T),
      n.commandStorage = n(),
      
      mean.eventStorage = mean(eventStorage, na.rm =T),
      sd.eventStorage = sd(eventStorage, na.rm =T),
      n.eventStorage = n(),
      
      mean.checkpointStorage = mean(checkpointStorage, na.rm =T),
      sd.checkpointStorage = sd(checkpointStorage, na.rm =T),
      n.checkpointStorage = n(),
      
      
    )%>%
    mutate(
           se.reconstructible = sd.reconstructible / sqrt(n.reconstructible),
           lower.ci.reconstructible = mean.reconstructible - qt(1 - (0.05 / 2), n.reconstructible - 1) * se.reconstructible,
           upper.ci.reconstructible = mean.reconstructible + qt(1 - (0.05 / 2), n.reconstructible - 1) * se.reconstructible,

           se.commandStorage = sd.commandStorage / sqrt(n.commandStorage),
           lower.ci.commandStorage = mean.commandStorage - qt(1 - (0.05 / 2), n.commandStorage - 1) * se.commandStorage,
           upper.ci.commandStorage = mean.commandStorage + qt(1 - (0.05 / 2), n.commandStorage - 1) * se.commandStorage,
           
           se.eventStorage = sd.eventStorage / sqrt(n.eventStorage),
           lower.ci.eventStorage = mean.eventStorage - qt(1 - (0.05 / 2), n.eventStorage - 1) * se.eventStorage,
           upper.ci.eventStorage = mean.eventStorage + qt(1 - (0.05 / 2), n.eventStorage - 1) * se.eventStorage,
           
           se.checkpointStorage = sd.checkpointStorage / sqrt(n.checkpointStorage),
           lower.ci.checkpointStorage = mean.checkpointStorage - qt(1 - (0.05 / 2), n.checkpointStorage - 1) * se.checkpointStorage,
           upper.ci.checkpointStorage = mean.checkpointStorage + qt(1 - (0.05 / 2), n.checkpointStorage - 1) * se.checkpointStorage,

    )
    
  
  tidy
}


tidyData <- function(data){
  tidy <- data  %>%
    filter(iteration == 1) %>%
    group_by(workload,approach,step) %>%
    summarize(lastGlobalClock = max(globalClock), commandStorage = sum(command), eventStorage = sum(event), eventCheckpoint = sum(checkpoint), logEntries = max(rowNr)) 
  
  tidy$reconstructible = tidy$logEntries/(1+tidy$lastGlobalClock)
  
  tidy
}

