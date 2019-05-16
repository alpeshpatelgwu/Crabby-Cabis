#Import dependencies required for ML

import pandas as pd
from sklearn.externals import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn import tree
from sklearn import ensemble
import datetime
import numpy as np
import pandas as pd
from pandas.tseries.offsets import Hour
import traceback
import os
from dateutil.relativedelta import relativedelta
#Prepare to load Data Frames with SQLAlchemy
from sqlalchemy import create_engine, sql
import pymysql
pymysql.install_as_MySQLdb()

#from config import remote_db_endpoint, remote_db_port
#from config import remote_gwsis_dbname, remote_gwsis_dbuser, remote_gwsis_dbpwd
# AWS Database Info - Put in Config file!
remote_db_endpoint = 'gwcodingbootcamp.cr0gccbv4ylw.us-east-2.rds.amazonaws.com'
remote_db_port = '3306'
remote_gwsis_dbname = 'bikeshare_db'
remote_gwsis_dbuser = 'root'
remote_gwsis_dbpwd = 'braddocks'
# ADD PASSWORD HERE FOR AWS DATABASE - i know i shouldn't put it, 
#but couldn't get separate users to 
# AWS Database Connection
engine = create_engine(f"mysql://{remote_gwsis_dbuser}:{remote_gwsis_dbpwd}@{remote_db_endpoint}:{remote_db_port}/{remote_gwsis_dbname}")
# Create a remote database engine connection
conn = engine.connect()

START_DATE = "2019-04-07 00:00:00"
END_DATE = datetime.date.today()
# Get and Adjust Data
#START_DATE = datetime.date.today() - relativedelta(months=26)
#Data only starts at 4/7
def build_model(file_prefix, station_id):

    data_list = []
    start = pd.to_datetime(START_DATE, infer_datetime_format=True)
    end = pd.to_datetime(END_DATE, infer_datetime_format=True)
    bike_counts = pd.read_sql(f"SELECT time, num_bikes, num_empty_docks FROM bikeshare WHERE time BETWEEN '{start}' AND '{end}' AND term_num = '{station_id}'", \
        conn)  

    #Itterating through rows and identifying status of station
    for index, row in bike_counts.iterrows():
        if not (row['num_bikes'] == 0 and row['num_empty_docks'] == 0):
            # A status of np.nan means the station is neither full nor empty.
            if row['num_bikes'] == 0:
                bike_counts.loc[index,'status'] = 'empty'
            elif row['num_empty_docks'] == 0:
                bike_counts.loc[index,'status'] = 'full'
            else:
                bike_counts.loc[index,'status'] = 'avail'

    aws_df = bike_counts[["time","status"]]

    # Format Final Data Frame 
    final_df = aws_df.groupby(aws_df.index).first()
    final_df = final_df.set_index(['time'])
    final_df.sort_index(inplace=True)

    # Weather Data Capture
    X = []
    y =[]
    yfull = []

    weather = pd.read_sql_query("SELECT * FROM hourly_weather", conn, index_col="ts")
    weather.index = weather.index.tz_localize(None)
    
    # Get rid of duplicates
    weather = weather.groupby(level=0).first()
    weather = weather.asfreq(Hour(), method="pad")
    no_weather_count = 0

    #Encoding 
    for index, row in final_df.iterrows():

        hour = index.replace(minute=0, second=0, microsecond=0, tzinfo=None)  
        try:
            temp_hour = hour
            temp = float(weather.loc[temp_hour].temp)

            while pd.isnull(temp):
                temp_hour = temp_hour - datetime.timedelta(hours=1)
                temp = float(weather.loc[temp_hour].temp)

            precip_hour = hour
            precip = float(weather.loc[hour].precip)

            while pd.isnull(precip):
                precip_hour = precip_hour - datetime.timedelta(hours=1)
                precip = float(weather.loc[precip_hour].precip)

            features = [
                (1 if index.dayofweek == 0 else 0),
                (1 if index.dayofweek == 1 else 0),
                (1 if index.dayofweek == 2 else 0),
                (1 if index.dayofweek == 3 else 0),
                (1 if index.dayofweek == 4 else 0),
                (1 if index.dayofweek == 5 else 0),
                (1 if index.dayofweek == 6 else 0),
                float(((index.hour * 60) + index.minute)) / 1440.0,
                float(index.month) / 12.0,
                temp / 50.0,
                precip / 15.0
            ]

            #0 if empty, 1 if available, 2 if full
            X.append(features)
            y.append(0 if row[0] == "empty" else (1 if row[0] == "avail" else 2))
    #         yempty.append(1 if row[0] == "empty" else 0)
            yfull.append(1 if row[0] == "full" else 0)
        except KeyError as ex:
            no_weather_count += 1

    print("Weather not found for", no_weather_count, "rows.")

    rf = RandomForestClassifier(n_estimators=200)
    X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y)
    rf = rf.fit(X_train, y_train)

    joblib.dump(rf, file_prefix, compress=True)

try:
    # Get list of all station ids.
    query = sql.text(
        "SELECT DISTINCT term_num FROM bikeshare WHERE time = '2019-04-03 21:14:00'"
        "UNION "
        "SELECT DISTINCT 'Terminal Number' FROM historic_cabioutage;")
    id_list = conn.execute(query)

    print("Starting model builds.", datetime.datetime.now().strftime('%c'))

    # Build and save a model for each station.
    for row in id_list:
        try:
            station_id = row[0]
            model_path = "models/station_" + str(station_id)

            # Create folder for model if needed.
            if not os.path.isdir(model_path):
                os.makedirs(model_path)
            print("Station", str(station_id))
            build_model(model_path + "/model",station_id)

        except Exception as err:
            print("Error while building model for station", str(station_id))
            print(traceback.format_exc())

except Exception as err:
    print(datetime.datetime.now().strftime('%c'))
    print(traceback.format_exc())
    raise



