"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const [airQualityData, setAirQualityData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });
  const searchParams = useSearchParams();

  const fetchAirQualityData = async (latitude, longitude, retryCount = 0) => {
    try {
      const res = await fetch(
        `/api/airquality?lat=${latitude}&long=${longitude}`
      );
      const data = await res.json();

      if (data.results?.length > 0) {
        const result = data.results[0];
        const pm25Measurement = result.measurements.find(
          (measurement) => measurement.parameter === "pm25"
        );

        if (pm25Measurement) {
          setAirQualityData({
            coordinates: { latitude, longitude },
            location: result.location,
            pm25Value: pm25Measurement.value,
            lastUpdated: pm25Measurement.lastUpdated,
          });
        } else {
          setError(`ไม่พบข้อมูลค่า PM2.5 สำหรับตำแหน่งนี้`);
        }
      } else if (retryCount < 5) {
        await fetchAirQualityData(
          latitude + 0.25,
          longitude + 0.25,
          retryCount + 1
        );
      } else {
        setError(`ไม่พบข้อมูลอากาศหลังจากพยายามหลายครั้ง`);
      }
    } catch {
      setError(`เกิดข้อผิดพลาดในการดึงข้อมูล`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    const gpsLatitude = searchParams.get("gpsLatitude");
    const gpsLongitude = searchParams.get("gpsLongitude");

    if (gpsLatitude && gpsLongitude) {
      const lat = parseFloat(gpsLatitude);
      const long = parseFloat(gpsLongitude);
      setCoordinates({ latitude: lat, longitude: long });
      await fetchAirQualityData(lat, long);
    } else {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        await fetchAirQualityData(latitude, longitude);
      } catch {
        setError(`ไม่สามารถดึงตำแหน่งได้`);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-red-600">{error}</div>
        {coordinates.latitude && coordinates.longitude && (
          <div className="text-lg font-semibold text-yellow-600">
            จาก Geolocation ละติจูด: {coordinates.latitude}, ลองจิจูด:{" "}
            {coordinates.longitude}
          </div>
        )}
      </div>
    );
  }

  const { latitude, longitude } = airQualityData?.coordinates || {};
  const { location, pm25Value, lastUpdated } = airQualityData || {};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">
          ข้อมูลคุณภาพอากาศ
        </h1>
        <ul className="text-gray-700">
          <li>
            <strong>ละติจูด:</strong> {latitude}
          </li>
          <li>
            <strong>ลองจิจูด:</strong> {longitude}
          </li>
          <li>
            <strong>สถานที่:</strong> {location}
          </li>
          <li>
            <strong>ค่า PM2.5:</strong> {pm25Value} µg/m³
          </li>
          <li>
            <strong>อัปเดตล่าสุด:</strong>{" "}
            {lastUpdated ? new Date(lastUpdated).toLocaleString() : "N/A"}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>กำลังโหลดข้อมูล...</div>}>
      <HomeContent />
    </Suspense>
  );
}
