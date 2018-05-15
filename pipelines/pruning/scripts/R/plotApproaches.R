# Function for plotting all approaches and emiting two PDF plots
plotApproaches <- function(df, na.rm = TRUE, ...){
  approach_list <- unique(df$approach)  
  
  plotWidth = 40
  plotHeight = 22
  
  for (i in seq_along(approach_list)) { 
    
    storagePlot <- ggplot(subset(df,df$approach==approach_list[i]), aes(x=step)) +
      geom_point(aes(y=mean.commandStorage, color="Commands"), shape = 1)  +
      geom_errorbar(aes(ymin=lower.ci.commandStorage, ymax=upper.ci.commandStorage, color="Commands"), width=.1) +
      geom_line(aes(y=mean.commandStorage, color="Commands"))  +
      
      geom_point(aes(y=mean.eventStorage, color="Events"), shape = 2)  +
      geom_errorbar(aes(ymin=lower.ci.eventStorage, ymax=upper.ci.eventStorage, color="Events"), width=.1) +
      geom_line(aes(y=mean.eventStorage, color="Events"))  +

      geom_point(aes(y=mean.checkpointStorage, color="Checkpoints"), shape = 3)  +
      geom_errorbar(aes(ymin=lower.ci.checkpointStorage, ymax=upper.ci.checkpointStorage, color="Checkpoints"), width=.1) +
      geom_line(aes(y=mean.checkpointStorage, color="Checkpoints"))  +

      geom_point(aes(y=mean.checkpointStorage+mean.eventStorage+mean.commandStorage, color="Total"), shape = 4)  +
      geom_errorbar(aes(ymin=lower.ci.commandStorage+lower.ci.eventStorage+lower.ci.checkpointStorage, ymax=upper.ci.commandStorage+upper.ci.eventStorage+upper.ci.checkpointStorage, color="Total"), width=.1) +
      geom_line(aes(y=mean.checkpointStorage+mean.eventStorage+mean.commandStorage, color="Total"))  +
      
    
      #labs(title ="", x="", y="Log Size [Byte]") +
      labs(title ="", x="", y="") +
      theme (
        # axis.title.x=element_blank(),
        axis.text.x=element_blank(),
        axis.ticks.x=element_blank(),
        #         axis.title.y=element_blank(),
        legend.position = "bottom",
        legend.title = element_blank(),
        plot.margin=unit(c(0,0,0,0),"cm")
      )+ 
      guides(color=FALSE) +
      scale_x_continuous(
        limits =c(0,11),
        breaks = c(seq(1,10,1)),
        minor_breaks = NULL, #seq(1,9,2),
        expand = c(0,0)
      ) +
      scale_y_continuous( labels=format_si()) 
    #      facet_wrap(~approach,  scales="free", ncol  = 4) 
    
    
    print(storagePlot)
    
    
    ggsave(paste("storageOverTime",gsub(" ", "",approach_list[i]),".pdf", sep=''), plot = last_plot(), device = cairo_pdf, path = plotsDir,
           scale = 2, width = plotWidth, height =plotHeight, units = "mm",
           dpi = 300)
    
    reconsPlot <- ggplot(subset(df,df$approach==approach_list[i]), aes(x=step)) +
      geom_bar(aes(y=mean.reconstructible), fill="gray", color="black", stat="identity") +
      geom_errorbar(aes(ymin=lower.ci.reconstructible, ymax=upper.ci.reconstructible), width=.1) +
      #  geom_line(aes(y=reconstructible, color="reconstructible")) +
      #  geom_line(aes(y=logEntries, color="log entries")) +
      #  geom_line(aes(y=lastGlobalClock, color="clock")) +
      #  geom_point(aes(y= reconstructible)) +
      #      labs(title ="", x="", y="Reconstructibility") +
      labs(title ="", x="", y="") +
      theme (
        # axis.title.x=element_blank(),
        axis.text.x=element_text(angle=90),
        #axis.ticks.x=element_blank(),
        #         axis.title.y=element_blank(),
        legend.position = "bottom",
        legend.title = element_blank(),,
        plot.margin=unit(c(0,0,0,0),"cm")
      )+ 
      #guides(color=FALSE) +
      scale_y_continuous(
        labels=percent,
        limits = c(0,1)
      ) +
      scale_x_continuous(
        limits =c(0,11),
        breaks = c(seq(1,10,1)),
        minor_breaks = NULL,
        #minor_breaks = seq(1,9,2),
        labels = c("1" = "10%", "2" = "20%", "3" = "30%", "4" = "40%", "5" = "50%", "6" = "60%", "7" = "70%", "8" = "80%", "9" = "90%", "10" ="100%"),
        expand = c(0,0)
      )
    
    print(reconsPlot)
    
    
    ggsave(paste("reconstructabilityOverTime",gsub(" ", "",approach_list[i]),".pdf", sep=''), plot = last_plot(), device = cairo_pdf, path = plotsDir,
           scale = 2, width = plotWidth, height =plotHeight, units = "mm",
           dpi = 300)
    
  }
  
}
