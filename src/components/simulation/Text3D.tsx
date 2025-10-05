import { useRef } from "react";

import * as THREE from "three";
import { Text } from "@react-three/drei";

interface Text3DProps {
  position: [number, number, number];
  text: string;
  color?: string;
  size?: number;
  visible?: boolean;
}

export function Text3D({ 
  position, 
  text, 
  color = "#ffffff", 
  size = 0.1, 
  visible = true 
}: Text3DProps) {
  const textRef = useRef<THREE.Mesh>(null);

  if (!visible) return null;

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={2}
      lineHeight={1}
      letterSpacing={0.02}
      textAlign="center"
    >
      {text}
    </Text>
  );
}
