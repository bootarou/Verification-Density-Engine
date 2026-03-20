type VDInput = {
  Nc: number;        // 一致確認
  Ne: number;        // 誤り指摘
  Ncorr: number;     // 訂正
  Napp: number;      // 追記
  Na: number;        // 承認
  U: number;         // 未解決誤り

  L: number;         // データ長
  F: number;         // フィールド数
  C: number;         // 主張数

  weights?: {
    wc?: number;
    we?: number;
    wcorr?: number;
    wapp?: number;
    wa?: number;
    wu?: number;
  };

  scale?: {
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
};

type VDOutput = {
  vd: number;           // Verification Density
  rawScore: number;     // 分子
  scale: number;        // 分母
  trust: number;        // Trust Score
  resolvedRatio: number;
};

export function calculateVD(input: VDInput): VDOutput {
  const {
    Nc, Ne, Ncorr, Napp, Na, U,
    L, F, C,
    weights = {},
    scale = {}
  } = input;

  const {
    wc = 1.0,
    we = 0.9,
    wcorr = 1.4,
    wapp = 0.6,
    wa = 1.1,
    wu = 1.8
  } = weights;

  const {
    alpha = 0.004,
    beta = 0.35,
    gamma = 0.8
  } = scale;

  // 分子
  const rawScore =
    wc * Nc +
    we * Ne +
    wcorr * Ncorr +
    wapp * Napp +
    wa * Na -
    wu * U;

  // 分母
  const denominator =
    alpha * L +
    beta * F +
    gamma * C;

  const scaleValue = Math.max(1, denominator);

  const vd = rawScore / scaleValue;

  // Trust計算
  const resolvedErrors = Math.max(0, Ne - U);
  const resolvedRatio = Ne > 0 ? resolvedErrors / Ne : 1;

  const trustNumerator =
    Nc + Ncorr + Na + resolvedErrors;

  const trustDenominator =
    Nc + Ne + U + 1;

  const trust =
    Math.min(1, Math.max(0,
      0.25 + 0.75 * (trustNumerator / trustDenominator) * resolvedRatio
    ));

  return {
    vd,
    rawScore,
    scale: scaleValue,
    trust,
    resolvedRatio
  };
}
