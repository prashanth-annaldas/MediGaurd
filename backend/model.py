from prophet import Prophet

def calculate_hsi(bed, icu, vent, em):
    return 0.35*bed + 0.25*icu + 0.20*vent + 0.20*em


def run_forecast(data):

    data = data.copy()

    data['Emergency_Pressure'] = (
        data['Emergency_Admissions'] /
        data['Emergency_Admissions'].max()
    ) * 100

    data['HSI'] = (
        0.35*data['Bed_Occupancy_Rate'] +
        0.25*data['ICU_Occupancy_Rate'] +
        0.20*data['Ventilator_Utilization_Rate'] +
        0.20*data['Emergency_Pressure']
    )

    df = data[['Date','HSI']].rename(columns={'Date':'ds','HSI':'y'})

    model = Prophet()
    model.fit(df)

    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)

    return forecast[['ds','yhat']]