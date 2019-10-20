# import necessary libraries
from sqlalchemy import (func, create_engine)
import pymysql
pymysql.install_as_MySQLdb()

import pandas as pd

from datetime import date

from flask import (
    Flask,
    request,
    render_template,
    jsonify)

from flask_sqlalchemy import SQLAlchemy

from flask.json import JSONEncoder

remote_db_endpoint = 'crabby-cabis.ccidoelgevpg.us-east-2.rds.amazonaws.com'
remote_db_port = '3306'
remote_gwsis_dbname = 'bikeshare_db'
remote_gwsis_dbuser = 'root'
remote_gwsis_dbpwd = 'braddocks'

# AWS Database Connection
engine = create_engine(f"mysql://{remote_gwsis_dbuser}:{remote_gwsis_dbpwd}@{remote_db_endpoint}:{remote_db_port}/{remote_gwsis_dbname}")

print(engine)

# Create a remote database engine connection
conn = engine.connect()

class CustomJSONEncoder(JSONEncoder):

    def default(self, obj):
        try:
            if isinstance(obj, date):
                return obj.isoformat()
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)

app = Flask(__name__)

app.json_encoder = CustomJSONEncoder

# Create a route that renders index.html template
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/station_status")
def station_status():
    return render_template("station_status.html")

@app.route("/ping")
def ping():
    return render_template("ping.html")

@app.route("/team")
def team():
    return render_template("team.html")

@app.route("/current_cabi_status")
def cabi_status():
    return render_template("current_cabi_status.html")
   

# Query the database and return the jsonified results
@app.route("/data")
def data():
    

    # start_date = request.args.get("startDate")
    # end_date = request.args.get("endDate")


    conn = engine.connect()

    #bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time BETWEEN '2019-04-06 09:52:00' AND '2019-04-07 09:52:00'", conn)

    #bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time = '%{start_date} 09:52:00'", conn, 
    #                        params={"start_date":start_date})

#SELECT * FROM bikeshare_db.bikeshare WHERE time LIKE '2019-04-06%' AND num_bikes = 0 GROUP BY term_id;
    bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time ='2019-04-06 09:52:00'", conn)


    #return jsonify(bike_df.to_dict())
    return jsonify(bike_df.to_dict(orient="records"))



@app.route("/jisan")
def jisan():
    
    conn = engine.connect()

    #print(request.args.get("name"))
    #print("fuck this")

    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    #term_id = request.args.get("termID")


    #q = f"SELECT * FROM bikeshare WHERE time BETWEEN '{start_date}%%' AND '{end_date}%%' AND term_id = '{term_id}'"
    
    #print (q)

    bike_df = pd.read_sql(f"SELECT * FROM bikeshare WHERE time BETWEEN '{start_date}%%' AND '{end_date}%%' AND num_bikes = 0 GROUP BY term_id", conn)
    #                        params={"start_date":start_date})

    #bike_df = pd.read_sql(f"SELECT * FROM bikeshare WHERE time BETWEEN '{start_date}%%' AND '{end_date}%%' AND term_id = '{term_id}'", conn)
    #, params={"start_date":start_date,"end_date":end_date,"term_id":term_id})

#    bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time = '2019-04-06 09:52:00'", conn, 
#                            params={"start_date":start_date}) 


    #bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time LIKE `2019-04-06 %`", conn)
#                            params={"start_date":start_date})

    #SELECT * FROM bikeshare_db.bikeshare WHERE time LIKE '2019-04-06%' AND num_bikes = 0 GROUP BY term_id;
    #bike_df = pd.read_sql("SELECT * FROM bikeshare WHERE time ='2019-04-06 09:52:00'", conn)  

    #%{start_date}
    #return jsonify(bike_df.to_dict())
    # bike_json = bike_df.to_json(orient="records")
    
    return jsonify(bike_df.to_dict(orient="records"))

    #return(start_date)

@app.route("/chart")
def chart():
    
    conn = engine.connect()

    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    term_id = request.args.get("termID")

    q = f"SELECT * FROM bikeshare WHERE time BETWEEN '{start_date}%%' AND '{end_date}%%' AND term_id = '{term_id}'"
    print (q)

    bike_df = pd.read_sql(f"SELECT * FROM bikeshare WHERE time BETWEEN '{start_date}%%' AND '{end_date}%%' AND term_id = '{term_id}'", conn)   
    return jsonify(bike_df.to_dict(orient="records"))

@app.route("/tom")
def tom():
    print(request.args.get("name"))
    return("You are here Tom")

if __name__ == "__main__":
    app.run(debug=True)
