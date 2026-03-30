import React from "react";
import moment from "moment";
import "moment/locale/vi";

moment.locale("vi");

export default function TimeConvert({ timestamp }) {
  if (!timestamp) return null;

  const time = typeof timestamp === "number"
    ? moment(timestamp)
    : moment(timestamp);

  return <span>{time.fromNow()}</span>;
}