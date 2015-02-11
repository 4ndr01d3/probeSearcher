Instructions to install probe-searcher

1. Get the most updated probes information form biomart using the uploader biomartProbes. 
   This requires to be executed twice, one for uniprot and one for ensemble.
       > java -jar biomartProbes-1.1.jar FETCH ENSEMBL
       > java -jar biomartProbes-1.1.jar FETCH UNIPROT
   
   By executing this commands the folders resultsENSEMBL and resultsUNIPROT will be created
   and populated with the data from biomart.
   
2. Get a solr Instance with the 2 cores up and running.
	2.1 untar the solr server
		> tar xvfz probe_solr.tgz
	2.2 Run the server
		> cd probe_solr
		> java -jar -Xmx500m start.jar
	This solr instance has been set up to run in port 8984, but that can be changed in the
	file probe_solr/etc/jetty.xml
	Assuming is using localhost, you can check that is running by checking this URL 
	http://localhost:8984/solr/ 
3. Load the data into the solr servers using the same biomartProbes tool.
		> java -jar biomartProbes-1.1.jar UPLOAD resultsENSEMBL/ http://localhost:8984/solr/ensembl2probes
		> java -jar biomartProbes-1.1.jar UPLOAD resultsUNIPROT/ http://localhost:8984/solr/uniprot2probes
	You can check it has been loaded by testing this URL
	http://localhost:8984/solr/ensembl2probes/select?q=*&fq=&start=0&rows=10
4. Install tomcat
		> tar xvfz apache-tomcat-7.0.11.tar.gz
		> cd tomcat/bin
		> ./startup
	You can change the port where tomcat will be running editing the file [tomcat]/conf/server.xml
	it usually runs on port 8080. check http://localhost:8080
5. Install the DAS server in tomcat.
		> cp das-srv.war tomcat/webapps/
		> cd tomcat/bin
		> ./shutdown
		> ./startup
6. Configure the DAS server editing the file  [tomcat]/webapps/das-srv/MydasServerConfig.xml
	6.1 Edit the values of the global properties keyphrase and indexerpath:
        <property key="keyphrase" value="confirmation"/>
        <property key="indexerpath" value="/tmp"/>
	6.2 For each data source edit the values of the property solr_url
		<property key="solr_url" value="http://127.0.0.1:8984/solr/uniprot2probes"/>
	6.3 restart tomcat
		> ./shutdown
		> ./startup
7. Index the DAS datasources by going to the URL http://localhost:8080/das-srv/das/indexer?keyphrase=yes
	Remeber to update the server/port in case you are using a different one.
8. Install the website in a web server (e.g. apache)
		> tar xvfz website.tgz
		> mv website/* [apache_dir]/probes-search
9. Edit the 1st line of the javascript file that points to the DAS server: [probes-search]/js/control.js
	var server_url = 'http://localhost:8081/das-srv/das/';


