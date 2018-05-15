loadAllFiles <- function(csvDir){
    
  
  #result-PB-p=0.1-7-workload_100k_01-100004.txt
  #                ^               ^
  #               (step) | (iteration)
  
  data <-
    list.files(path = csvDir, pattern="result-*", full.names = T)  %>% 
    map_df(function(x) read_csv(x ,col_names = c("globalClock", "actorId", "actorClock", "command", "event", "checkpoint"), 
                                col_types = cols("actorId" = col_character())) %>% mutate(rowNr = n(), filename=gsub(".csv","",basename(x)))) %>%   #rowNr: number of line
    separate(filename, c("skip1","approachName","params","step","workloadId","maxglcx"), "-", remove =T ) %>%                            #extract values from filename
    separate(workloadId, c("skip2","workload","iteration"), "_", remove =T ) %>%
    select(-one_of("skip1","skip2"))
}