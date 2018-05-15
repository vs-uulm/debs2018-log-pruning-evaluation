cleanupData <- function(data){
  data$step <- as.numeric(data$step) 
  data$approach = paste(data$approachName," ",data$params) #approach as combination of name and parameters
  data$iteration = as.numeric(gsub(".txt","",data$iteration))
  
  data
}