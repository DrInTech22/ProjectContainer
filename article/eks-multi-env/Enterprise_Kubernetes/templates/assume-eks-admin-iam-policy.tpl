{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["sts:AssumeRole"],
      "Effect": "Allow",
      "Resource": "${assume_eks_admin_iam_policy}"
    }
  ]
}