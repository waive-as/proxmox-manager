
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceChart from "../charts/ResourceChart";
import { Node } from "@/services/api";

interface ResourcesChartProps {
  title: string;
  nodes: Node[];
  dataKey: "cpu" | "memory";
  color: string;
}

const ResourcesChart: React.FC<ResourcesChartProps> = ({
  title,
  nodes,
  dataKey,
  color,
}) => {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResourceChart
          data={nodes.map((node) => ({
            name: node.name,
            value: node[dataKey].usage,
          }))}
          color={color}
          dataKey="value"
          yAxisLabel="Usage (%)"
        />
      </CardContent>
    </Card>
  );
};

export default ResourcesChart;
